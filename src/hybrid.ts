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

const handleRespone = async (response: Response) => {
  const text = await response.text();
  const start = performance.now();
  const doc = parser.parseFromString(text, 'text/html');
  switch (ENGINE) {
    case 'nanomorph':
      nanomorph(document.documentElement, doc.documentElement);
      break;
    case 'morphdom':
      morphdom(document.documentElement, doc.documentElement, morphdomOptions);
      break;
    case 'diffdom':
      {
        const diff = dd.diff(document.documentElement, doc.documentElement);
        const startApply = performance.now();
        dd.apply(document.documentElement, diff);
        const endApply = performance.now();
        console.info('Application took', endApply - startApply);
      }
      break;
    case 'snabbdom':
      {
        const newVDom = toVNode(doc.documentElement);
        const startApply = performance.now();
        patch(currentVDom, newVDom);
        currentVDom = newVDom;
        const endApply = performance.now();
        console.info('Application took', endApply - startApply);
      }
      break;
  }
  const end = performance.now();
  console.info('Transition took', end - start);
};

const parser = new DOMParser();
const handleTransition = async (targetUrl: string) => {
  abortController?.abort();
  abortController = new AbortController();
  document.body.classList.add('is-loading');
  return fetch(targetUrl, {
    credentials: 'same-origin',
    redirect: 'follow',
    signal: abortController.signal,
  })
    .then(handleRespone)
    .catch(error => {
      if (error.name !== 'AbortError') {
        console.error(error, `Unable to resolve "${targetUrl}". Doing hard load instead...`);
        window.location.href = targetUrl;
      }
    });
};

const navigateTo = async (targetUrl: string) => {
  await handleTransition(targetUrl);
  window.history.pushState(null, document.title, targetUrl);
  window.scrollTo(0, 0);
};

const handleClick = async (event: Event) => {
  if (event?.target && isLocalLink(event.target as Node)) {
    event.preventDefault();
    navigateTo((event.target as HTMLAnchorElement).getAttribute('href') ?? '');
  }
};

const handleSubmit = async (event: Event) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const query = new URLSearchParams(new FormData(form) as any).toString();
  await navigateTo(form.action + (query ? '?' + query : ''));
};

document.addEventListener('DOMContentLoaded', function() {
  currentVDom = toVNode(document.documentElement);
  document.addEventListener('click', handleClick);
  document.addEventListener('submit', handleSubmit);
  window.onpopstate = (event: PopStateEvent) => handleTransition((event?.target as Window).location.href);
});
