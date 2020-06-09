import products from './products.json';

const getProducts = (): Promise<any> => new Promise((resolve) => setTimeout(() => resolve(products.results[0]), 200));

export default getProducts;
