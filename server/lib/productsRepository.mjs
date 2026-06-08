import fs from 'node:fs';
import path from 'node:path';

const productFile = path.resolve('src/data/products.json');

export function readProducts() {
  if (!fs.existsSync(productFile)) {
    return [];
  }

  const parsed = JSON.parse(fs.readFileSync(productFile, 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error('src/data/products.json must be an array.');
  }

  return parsed;
}

export function writeProducts(products) {
  if (!Array.isArray(products)) {
    throw new Error('Products must be an array.');
  }

  fs.writeFileSync(productFile, `${JSON.stringify(products, null, 2)}\n`);
}
