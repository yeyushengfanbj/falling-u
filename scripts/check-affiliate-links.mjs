import fs from 'node:fs';
import path from 'node:path';

const productFile = path.resolve('src/data/products.json');
const errors = [];

function readProducts() {
  try {
    const sourceText = fs.readFileSync(productFile, 'utf8');
    const parsed = JSON.parse(sourceText);

    if (!Array.isArray(parsed)) {
      errors.push('src/data/products.json 必须是商品数组。');
      return [];
    }

    return parsed;
  } catch (error) {
    errors.push(`无法读取或解析 src/data/products.json：${error.message}`);
    return [];
  }
}

function describeProduct(product, index) {
  if (product.id && product.name) {
    return `${product.id} (${product.name})`;
  }

  return `第 ${index + 1} 个商品`;
}

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

const products = readProducts();
const ids = new Set();
const affiliateUrls = new Set();

products.forEach((product, index) => {
  const label = describeProduct(product, index);

  if (!product || typeof product !== 'object' || Array.isArray(product)) {
    errors.push(`${label}: 商品必须是对象。`);
    return;
  }

  if (!product.id || typeof product.id !== 'string') {
    errors.push(`${label}: 缺少 id。`);
  } else if (ids.has(product.id)) {
    errors.push(`${label}: id 重复。`);
  } else {
    ids.add(product.id);
  }

  if (!product.category || typeof product.category !== 'string') {
    errors.push(`${label}: 缺少 category。`);
  }

  if (!product.name || typeof product.name !== 'string') {
    errors.push(`${label}: 缺少 name。`);
  }

  if (!product.jdTitle || typeof product.jdTitle !== 'string' || product.jdTitle.length < 12) {
    errors.push(`${label}: 缺少 jdTitle，商品卡片需要展示京东原始标题。`);
  }

  if (!product.summary || typeof product.summary !== 'string') {
    errors.push(`${label}: 缺少 summary。`);
  }

  if (!product.bestFor || typeof product.bestFor !== 'string') {
    errors.push(`${label}: 缺少 bestFor。`);
  }

  if (!product.typeLabel || typeof product.typeLabel !== 'string') {
    errors.push(`${label}: 缺少 typeLabel。`);
  }

  if (!Array.isArray(product.specs) || product.specs.length === 0) {
    errors.push(`${label}: 缺少 specs，商品卡片需要至少一个关键规格。`);
  }

  if (!Array.isArray(product.tags) || product.tags.length === 0) {
    errors.push(`${label}: 缺少 tags。`);
  }

  if (!isPositiveNumber(product.jdPrice)) {
    errors.push(`${label}: jdPrice 必须是大于 0 的数字。`);
  }

  if (!isPositiveNumber(product.finalPrice)) {
    errors.push(`${label}: finalPrice 必须是大于 0 的数字。`);
  }

  if (isPositiveNumber(product.jdPrice) && isPositiveNumber(product.finalPrice) && product.finalPrice > product.jdPrice) {
    errors.push(`${label}: finalPrice 不应高于 jdPrice。`);
  }

  if (product.jdSku && product.jdItemUrl) {
    let parsedItemUrl;
    try {
      parsedItemUrl = new URL(product.jdItemUrl);
    } catch {
      errors.push(`${label}: jdItemUrl 不是有效 URL。`);
    }

    if (parsedItemUrl && parsedItemUrl.hostname !== 'item.jd.com') {
      errors.push(`${label}: jdItemUrl 应使用 item.jd.com 商品页。`);
    }

    if (parsedItemUrl && !parsedItemUrl.pathname.includes(product.jdSku)) {
      errors.push(`${label}: jdItemUrl 路径中应包含 jdSku。`);
    }
  }

  if (product.image) {
    let parsedImageUrl;
    try {
      parsedImageUrl = new URL(product.image);
    } catch {
      errors.push(`${label}: image 不是有效 URL。`);
    }

    if (parsedImageUrl && !parsedImageUrl.hostname.endsWith('360buyimg.com')) {
      errors.push(`${label}: image 应使用京东商品图域名 360buyimg.com，避免图货不一致。`);
    }
  }

  if (!product.affiliateUrl || typeof product.affiliateUrl !== 'string') {
    errors.push(`${label}: 缺少 affiliateUrl。`);
    return;
  }

  let parsed;
  try {
    parsed = new URL(product.affiliateUrl);
  } catch {
    errors.push(`${label}: affiliateUrl 不是有效 URL。`);
    return;
  }

  if (parsed.protocol !== 'https:' || parsed.hostname !== 'u.jd.com') {
    errors.push(`${label}: affiliateUrl 应使用京东联盟短链 https://u.jd.com/...。`);
  }

  if (affiliateUrls.has(product.affiliateUrl)) {
    errors.push(`${label}: affiliateUrl 重复。`);
  } else {
    affiliateUrls.add(product.affiliateUrl);
  }
});

if (products.length === 0) {
  errors.push('products 数组为空。');
}

if (errors.length > 0) {
  console.error('京东联盟链接校验失败：');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`京东联盟链接校验通过：${products.length} 个商品。`);
