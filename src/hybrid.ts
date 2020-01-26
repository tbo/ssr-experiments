import morphdom from 'morphdom';

const fetchOptions: RequestInit = {
  credentials: 'same-origin',
  redirect: 'follow',
};

const isLink = (node: Node): node is HTMLAnchorElement => node.nodeName === 'A';

const morphdomOptions = {
  onBeforeNodeAdded: (added: Node) => {
    if (isLink(added) && added.href) {
      added.addEventListener('click', handleClick);
    }
    return added;
  },
  onBeforeElUpdated: (fromEl: Node, toEl: Node) => !fromEl.isEqualNode(toEl),
  onNodeDiscarded: (discarded: Node) => discarded.removeEventListener('click', handleClick),
};

const handleTransition = async (targetUrl: string) => {
  document.body.classList.add('is-loading');
  const response = await fetch(targetUrl, fetchOptions);
  morphdom(document.documentElement, await response.text(), morphdomOptions);
  document.body.classList.remove('is-loading');
};

const handleClick = async (event: Event) => {
  event.preventDefault();
  const targetUrl = (event.target as HTMLAnchorElement).href;
  await handleTransition(targetUrl);
  window.history.pushState(null, document.title, targetUrl);
};

document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('a[href]');
  links.forEach(link => link.addEventListener('click', handleClick));
  window.onpopstate = (event: PopStateEvent) => handleTransition((event?.target as Window).location.href);
});
