import { renderToNodeStream } from 'react-dom/server';
import Page from './page';
import getProducts from '../get-products';

const executeBenchmark = async () => renderToNodeStream(Page({ products: await getProducts() }));
export default executeBenchmark;
