import morphdom from 'morphdom';
import nanomorph from 'nanomorph';
import { DiffDOM } from 'diff-dom';
import * as snabbdom from 'snabbdom';
import toVNode from 'snabbdom/tovnode';
import { VNode } from 'snabbdom/vnode';

const patch = snabbdom.init([
  // Init patch function with chosen modules
  require('snabbdom/modules/class').default, // makes it easy to toggle classes
  require('snabbdom/modules/props').default, // for setting properties on DOM elements
  require('snabbdom/modules/style').default, // handles styling on elements with support for animations
  require('snabbdom/modules/eventlisteners').default, // attaches event listeners
  require('snabbdom/modules/attributes').default, // attaches event listeners
]);

let currentVDom: VNode;

const ENGINE = 'morphdom' as 'morphdom' | 'nanomorph' | 'diffdom' | 'snabbdom';
console.info('ENGINE:', ENGINE);

const dd = new DiffDOM();

const isLocalLink = (node: Node): boolean => {
  let linkNode = node;
  while (linkNode && linkNode.nodeName !== 'A') {
    linkNode = linkNode.parentNode as Node;
  }
  return linkNode && !~((linkNode as HTMLAnchorElement).getAttribute?.('href') ?? '').indexOf('://');
};

const isTextInput = (node: Node): node is HTMLInputElement =>
  node.nodeName === 'INPUT' && ['email', 'text', 'password'].includes((node as HTMLInputElement).type);

let cache: Cache;
window.caches.open('hybrid').then(c => (cache = c));

const morphdomOptions = {
  onBeforeElUpdated: (from: Node, to: Node) => {
    if (
      from === document.activeElement &&
      isTextInput(from) &&
      isTextInput(to) &&
      from.value !== from.getAttribute('value')
    ) {
      return false;
    }
    return !from.isEqualNode(to);
  },
};

let abortController: AbortController | null = null;

let eventSource: EventSource;

const parser = new DOMParser();

const getFirstValidResponse = <T>(requests: Promise<T>[]): Promise<T> =>
  new Promise(resolve => requests.forEach(request => request.then(result => result && resolve(result))));

const transformDom = (text: string) => {
  const start = performance.now();
  const newDom = parser.parseFromString(text, 'text/html');
  switch (ENGINE) {
    case 'nanomorph':
      nanomorph(document.documentElement, newDom.documentElement);
      break;
    case 'morphdom':
      morphdom(document.documentElement, newDom.documentElement, morphdomOptions);
      break;
    case 'diffdom': {
      const diff = dd.diff(document.documentElement, newDom.documentElement);
      const startApply = performance.now();
      dd.apply(document.documentElement, diff);
      const endApply = performance.now();
      console.info('Application took', endApply - startApply);
      break;
    }
    case 'snabbdom': {
      const newVDom = toVNode(newDom.documentElement);
      const startApply = performance.now();
      patch(currentVDom, newVDom);
      currentVDom = newVDom;
      const endApply = performance.now();
      console.info('Application took', endApply - startApply);
      break;
    }
  }
  const end = performance.now();
  console.info('Transition took', end - start);
};

const tryEventSource = (url: string) => {
  eventSource = new EventSource(url);
  eventSource.onmessage = event => transformDom(event.data);
  (abortController ?? (abortController = new AbortController())).signal.addEventListener('abort', () =>
    eventSource.close(),
  );
};

const handleRespone = (request: Request, mode: 'cache' | 'network', cacheRace: AbortController) => async (
  response: Response | undefined,
) => {
  if (!response) {
    return;
  }
  // The cache can be slower, than the network in some rare cases. We abort the
  // rendering of cached responses in those situations to avoid overriding
  // up-to-date responses with stale data.
  if (cacheRace.signal.aborted) {
    return;
  }
  if (response.headers.get('content-type')?.indexOf('text/html') === -1) {
    abortController?.abort();
    window.location.href = response.url;
    return;
  }
  await response
    .clone()
    .text()
    .then(transformDom);
  if (mode === 'network') {
    // Aborting requests of cached responses will lead to uncaught exceptions
    abortController = null;
    cache.put(response.url, response);
    if (response.status === 301) {
      cache.put(request.url, response);
    }
    cacheRace.abort();
    tryEventSource(response.url);
  }
  return response.url;
};

const handleTransition = (targetUrl: string, body?: BodyInit) => {
  abortController?.abort();
  abortController = new AbortController();
  const cacheRace = new AbortController();
  document.body.classList.add('is-loading');
  const request = new Request(targetUrl, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    redirect: 'follow',
    signal: abortController.signal,
    body,
  });
  const cachedTransition = cache?.match(request).then(handleRespone(request, 'cache', cacheRace));
  const networkTransition = fetch(request)
    .then(handleRespone(request, 'network', cacheRace))
    .catch(error => {
      if (error.name !== 'AbortError') {
        console.error(error, `Unable to resolve "${targetUrl}". Doing hard load instead...`);
        window.location.href = targetUrl;
      }
    });
  return getFirstValidResponse([cachedTransition, networkTransition]);
};

const navigateTo = async (targetUrl: string, body?: BodyInit) => {
  // The final and target URLs can differ due to HTTP redirects.
  const finalUrl = await handleTransition(targetUrl, body);
  if (finalUrl) {
    window.history.pushState(null, document.title, finalUrl);
    window.scrollTo(0, 0);
  }
};

const handleClick = (event: Event) => {
  if (event?.target && isLocalLink(event.target as Node)) {
    event.preventDefault();
    navigateTo((event.target as HTMLAnchorElement).getAttribute('href') ?? '');
  }
};

const handleSubmit = (event: Event) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const data = new FormData(form);
  if (form.method === 'post') {
    navigateTo(form.action, data);
  } else {
    const query = new URLSearchParams(data as any).toString();
    navigateTo(form.action + (query ? '?' + query : ''));
  }
};

document.addEventListener('DOMContentLoaded', function() {
  currentVDom = toVNode(document.documentElement);
  document.addEventListener('click', handleClick);
  document.addEventListener('submit', handleSubmit);
  window.onpopstate = (event: PopStateEvent) => handleTransition((event?.target as Window).location.href);
  tryEventSource(window.location.href);
});
