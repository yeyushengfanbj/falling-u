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
