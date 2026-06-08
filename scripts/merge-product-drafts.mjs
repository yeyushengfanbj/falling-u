import fs from 'node:fs';
import path from 'node:path';

const draftFile = path.resolve(process.argv.slice(2).find((arg) => !arg.startsWith('--')) ?? 'imports/product-drafts.json');
const productFile = path.resolve('src/data/products.json');

function readJsonArray(file) {
  if (!fs.existsSync(file)) {
    return [];
  }

  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (!Array.isArray(parsed)) {
    throw new Error(`${path.relative(process.cwd(), file)} 必须是数组。`);
  }

  return parsed;
}

function toProduct(draft) {
  const {
    importStatus,
    importNotes,
    ...product
  } = draft;

  return product;
}

const products = readJsonArray(productFile);
const drafts = readJsonArray(draftFile);
const existingIds = new Set(products.map((product) => product.id));
const existingAffiliateUrls = new Set(products.map((product) => product.affiliateUrl));
const readyDrafts = drafts.filter((draft) => draft.importStatus === 'ready');
const remainingDrafts = drafts.filter((draft) => draft.importStatus !== 'ready');
const merged = [];
const skipped = [];

for (const draft of readyDrafts) {
  if (existingIds.has(draft.id)) {
    skipped.push(`${draft.id}: id 已存在`);
    remainingDrafts.push(draft);
    continue;
  }

  if (existingAffiliateUrls.has(draft.affiliateUrl)) {
    skipped.push(`${draft.id}: affiliateUrl 已存在`);
    remainingDrafts.push(draft);
    continue;
  }

  const product = toProduct(draft);
  products.push(product);
  merged.push(product);
  existingIds.add(product.id);
  existingAffiliateUrls.add(product.affiliateUrl);
}

fs.writeFileSync(productFile, `${JSON.stringify(products, null, 2)}\n`);
fs.writeFileSync(draftFile, `${JSON.stringify(remainingDrafts, null, 2)}\n`);

console.log('商品草稿合并完成：');
console.log(`- ready 草稿：${readyDrafts.length}`);
console.log(`- 已合并：${merged.length}`);
console.log(`- 保留草稿：${remainingDrafts.length}`);

if (skipped.length > 0) {
  console.log('- 跳过：');
  for (const item of skipped) {
    console.log(`  - ${item}`);
  }
}
