import morphdom from 'morphdom';

const fetchOptions: RequestInit = {
  credentials: 'same-origin',
  redirect: 'follow',
};

const isLink = (node: Node): node is HTMLAnchorElement => node.nodeName === 'A';

const isLocalLink = (node: Node): boolean => isLink(node) && !~node.href?.indexOf('://');

const morphdomOptions = {
  onBeforeNodeAdded: (added: Node) => {
    if (isLocalLink(added)) {
      added.addEventListener('click', handleClick);
    }
    return added;
  },
  onBeforeElUpdated: (fromEl: Node, toEl: Node) => !fromEl.isEqualNode(toEl),
  onNodeDiscarded: (discarded: Node) => {
    discarded.removeEventListener('click', handleClick);
    discarded.removeEventListener('submit', handleSubmit);
  },
};

const handleTransition = async (targetUrl: string) => {
  document.body.classList.add('is-loading');
  try {
    const response = await fetch(targetUrl, fetchOptions);
    morphdom(document.documentElement, await response.text(), morphdomOptions);
  } catch {
    console.error(`Unable to resolve "${targetUrl}". Doing hard load instead...`);
    window.location.href = targetUrl;
  }
  document.body.classList.remove('is-loading');
};

const handleClick = async (event: Event) => {
  event.preventDefault();
  const targetUrl = (event.target as HTMLAnchorElement).href;
  await handleTransition(targetUrl);
  window.history.pushState(null, document.title, targetUrl);
};

const handleSubmit = async (event: Event) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const query = new URLSearchParams(new FormData(form) as any).toString();
  const targetUrl = form.action + (query ? '?' + query : '');
  await handleTransition(targetUrl);
  window.history.pushState(null, document.title, targetUrl);
};

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a:not([href*="://"]').forEach(link => link.addEventListener('click', handleClick));
  document.querySelectorAll('form:not([action*="://"]').forEach(form => form.addEventListener('submit', handleSubmit));
  window.onpopstate = (event: PopStateEvent) => handleTransition((event?.target as Window).location.href);
});
