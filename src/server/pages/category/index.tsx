import Base from '../../components/base';
import { search } from '../../utilities/algolia';
import ProductTile from './product-tile';
import classNames from 'classnames';
import { stringify } from 'querystring';

const getRange = (to: number) => [...Array(to).keys()];

const getQuery = (params: Record<string, string | number>) =>
  stringify(Object.fromEntries(Object.entries(params).filter(([, value]) => value)));

const Category = async ({ request }) => {
  const { query } = request.query;
  const activePage = Number(request.query.page) || 0;
  const response = await search(query || '', activePage);
  const { nbHits, nbPages, hits } = response.results[0];
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
