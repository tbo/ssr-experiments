import morphdom from 'morphdom';

const isLink = (node: Node): node is HTMLAnchorElement => node.nodeName === 'A';

const isLocalLink = (node: Node): boolean => isLink(node) && !~node.href?.indexOf('://');

const isTextInput = (node: Node): node is HTMLInputElement =>
  node.nodeName === 'INPUT' && ['email', 'text', 'password'].includes((node as HTMLInputElement).type);

const morphdomOptions = {
  onBeforeNodeAdded: (added: Node) => {
    if (isLocalLink(added)) {
      added.addEventListener('click', handleClick);
    }
    return added;
  },
  onBeforeElUpdated: (fromEl: Node, toEl: Node) => {
    if (
      fromEl === document.activeElement &&
      isTextInput(fromEl) &&
      isTextInput(toEl) &&
      fromEl.value !== fromEl.getAttribute('value')
    ) {
      return false;
    }
    return !fromEl.isEqualNode(toEl);
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
    const stuff = await response.text();
    const doc = parser.parseFromString(stuff, 'text/html');
    morphdom(document.documentElement, doc.documentElement, morphdomOptions);
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error(error, `Unable to resolve "${targetUrl}". Doing hard load instead...`);
      window.location.href = targetUrl;
    }
  }
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

class SearchBar extends HTMLElement {
  constructor() {
    super();
    const defaultSlot = document.createElement('slot');
    // const displaySlot = document.createElement('span');
    // defaultSlot.style.display = 'none';
    // displaySlot.setAttribute('name', 'display');
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(defaultSlot);
    // displaySlot.innerHTML = 'test';

    // shadowRoot.appendChild(defaultSlot);
    // shadowRoot.appendChild(displaySlot);
    // console.dir(this.innerHTML);
    // const morph = () => (displaySlot = defaultSlot.innerHTML);
    // const observer = new MutationObserver(update);
    // slot.addEventListener('slotchange', () =>
    //   slot
    //     .assignedNodes()
    //     .forEach(node => observer.observe(node, { attributes: true, childList: true, subtree: true })),
    // );
    // morphdom(shadowRoot, this);
    // console.log('morphing');
    // morph();
  }
}

window.customElements.define('search-bar', SearchBar);

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a:not([href*="://"]').forEach(link => link.addEventListener('click', handleClick));
  document.querySelectorAll('form:not([action*="://"]').forEach(form => form.addEventListener('submit', handleSubmit));
  window.onpopstate = (event: PopStateEvent) => handleTransition((event?.target as Window).location.href);
});
