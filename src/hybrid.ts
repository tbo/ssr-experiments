import morphdom from 'morphdom';

const isLink = (node: Node): node is HTMLAnchorElement => node.nodeName === 'A';

const isLocalLink = (node: Node): boolean => isLink(node) && !~(node?.getAttribute?.('href') ?? '').indexOf('://');

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

const parser = new DOMParser();
const handleTransition = async (targetUrl: string) => {
  abortController?.abort();
  abortController = new AbortController();
  document.body.classList.add('is-loading');
  try {
    const response = await fetch(targetUrl, {
      credentials: 'same-origin',
      redirect: 'follow',
      signal: abortController.signal,
    });
    const doc = parser.parseFromString(await response.text(), 'text/html');
    morphdom(document.documentElement, doc.documentElement, morphdomOptions);
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error(error, `Unable to resolve "${targetUrl}". Doing hard load instead...`);
      window.location.href = targetUrl;
    }
  }
};

const navigateTo = async (targetUrl: string) => {
  await handleTransition(targetUrl);
  window.history.pushState(null, document.title, targetUrl);
  window.scrollTo(0, 0);
};

const handleClick = async (event: Event) => {
  if (event?.target && isLocalLink(event.target as Node)) {
    event.preventDefault();
    await navigateTo((event.target as HTMLAnchorElement).href);
  }
};

const handleSubmit = async (event: Event) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const query = new URLSearchParams(new FormData(form) as any).toString();
  await navigateTo(form.action + (query ? '?' + query : ''));
};

document.addEventListener('DOMContentLoaded', function() {
  document.addEventListener('click', handleClick);
  document.addEventListener('submit', handleSubmit);
  window.onpopstate = (event: PopStateEvent) => handleTransition((event?.target as Window).location.href);
});
