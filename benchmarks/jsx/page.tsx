import Base from './base';
import ProductTile from './product-tile';
import classNames from 'classnames';
import { stringify } from 'querystring';
import getProducts from '../get-products';

const getRange = (to: number) => [...Array(to).keys()];

const getQuery = (params: Record<string, string | number>) =>
  stringify(Object.fromEntries(Object.entries(params).filter(([, value]) => value)));

const Category = async () => {
  const query = 'table';
  const { nbHits, nbPages, hits, page: activePage } = await getProducts();
  return (
    <Base>
      <p>
        <div className="chip">Hits: {nbHits}</div>
      </p>
      <div className="hits">
        {hits.map((product: any) => (
          <ProductTile key={product.id} {...product} />
        ))}
      </div>
      {nbPages > 0 && (
        <ul className="pagination">
          {getRange(nbPages).map((page) => (
            <li className={classNames('waves-effect', { active: activePage === page })} key={page}>
              <a href={`?${getQuery({ query, page })}`}>{page + 1}</a>
            </li>
          ))}
        </ul>
      )}
    </Base>
  );
};

export default Category;
