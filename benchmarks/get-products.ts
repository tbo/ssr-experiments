import products from './products.json';

const getProducts = (): Promise<any> => new Promise((resolve) => setImmediate(() => resolve(products.results[0])));

export default getProducts;
