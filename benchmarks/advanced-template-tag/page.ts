import classNames from 'classnames';
import { stringify } from 'querystring';
import getProducts from '../get-products';

const getRange = (to: number) => [...Array(to).keys()];

const getQuery = (params: Record<string, string | number>) =>
  stringify(Object.fromEntries(Object.entries(params).filter(([, value]) => value)));

const html = async (literalSections: any, ...substs: any[]) => {
  // Use raw literal sections: we don’t want
  // backslashes (\n etc.) to be interpreted
  const raw = literalSections.raw;

  let result = '';

  for (let i = 0; i < substs.length; i++) {
    let subst = substs[i] instanceof Promise ? await substs[i] : substs[i];
    // In the example, map() returns an array:
    // If substitution is an array (and not a string),
    // we turn it into a string
    if (Array.isArray(subst)) {
      subst = subst.join('');
    }

    result += raw[i] + subst;
  }
  // Take care of last literal section
  // (Never fails, because an empty template string
  // produces one literal section, an empty string)
  result += raw[raw.length - 1]; // (A)

  return result;
};

const Base = (contents: any) => html`
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <title>Hybrid Search</title>
    </head>
    <body>
      <nav>
        <div className="nav-wrapper">
          <a href="/" className="brand-logo" style="padding-left: 10">
            Hybrid Search
          </a>
          <ul id="nav-mobile" className="right hide-on-med-and-down">
            <li>
              <a href="/post-search">POST Example</a>
            </li>
            <li>
              <a href="/time">Time</a>
            </li>
            <li>
              <a href="/assets/sample.pdf">PDF</a>
            </li>
            <li>
              <a href="/assets/tcpip.html">TCP Spec</a>
            </li>
            <li>
              <a href="/examples">Examples</a>
            </li>
          </ul>
        </div>
      </nav>
      <br />
      <main>${contents}</main>
    </body>
  </html>
`;

const getProductTile = ({ id, name, price, description, image }: any) => html`
  <div id=${id} className="card blue-grey darken-1 hit">
    <div className="card-content white-text">
      <span className="card-title">${name}</span>
    </div>
    <div className="image-wrapper">
      <image loading="lazy" src=${image} />
    </div>
    <div className="card-content white-text">
      ${price} Euro
      <br />
      ${description}
    </div>
  </div>
`;

const getPaginationEntry = (activePage: number, query: string) => (page: number) => html`
  <li className="${classNames('waves-effect', { active: activePage === page })}>
    <a href="?${getQuery({ query, page })}">${page + 1}</a>
  </li>
`;

const getPagination = (total: number, activePage: number, query: string) => {
  if (!total) {
    return '';
  }
  return html`
    <ul className="pagination">
      ${getRange(total).map(getPaginationEntry(activePage, query))}
    </ul>
  `;
};

const Page = async () => {
  const products = await getProducts();
  const query = 'table';
  const { nbHits, nbPages, hits, page: activePage } = products;
  return Base(html`
      <p>
        <div className="chip">Hits: ${nbHits}</div>
      </p>
      <div className="hits">
        ${hits.map(getProductTile)}
      </div>
      ${getPagination(nbPages, activePage, query)}
  `);
};

export default Page;
