import productData from './products.json';

export type Product = {
  id: string;
  category: string;
  name: string;
  jdTitle: string;
  jdSku?: string;
  jdItemUrl?: string;
  summary: string;
  bestFor: string;
  priceBand: string;
  jdPrice: number;
  finalPrice: number;
  affiliateUrl: string;
  image?: string;
  typeLabel: string;
  specs: string[];
  tags: string[];
};

export const products = productData satisfies Product[];

export const getProductsByCategory = (category: string) =>
  products.filter((product) => product.category === category);
