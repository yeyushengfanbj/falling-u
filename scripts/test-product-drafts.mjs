import fs from 'node:fs';
import path from 'node:path';

import {
  createProductDraft,
  deleteProductDraft,
  publishProductDraft,
  updateProductDraft,
} from '../server/lib/productDraftsRepository.mjs';

const productFile = path.resolve('src/data/products.json');
const draftFile = path.resolve('imports/product-drafts.json');

function snapshot(file) {
  return {
    exists: fs.existsSync(file),
    content: fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '',
  };
}

function restore(file, snap) {
  if (snap.exists) {
    fs.writeFileSync(file, snap.content);
  } else if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const productsSnapshot = snapshot(productFile);
const draftsSnapshot = snapshot(draftFile);

try {
  const products = JSON.parse(fs.readFileSync(productFile, 'utf8'));
  const existingAffiliateUrl = products[0]?.affiliateUrl;
  assert(existingAffiliateUrl, '需要至少一个正式商品用于重复链接校验。');

  const draft = createProductDraft({
    product: {
      skuId: 'test-draft-sku',
      skuName: '测试商品 27英寸 4K 显示器',
      materialUrl: 'https://item.jd.com/test-draft-sku.html',
      imageUrl: 'https://img10.360buyimg.com/n1/test.jpg',
      price: 1299,
      finalPrice: 1199,
    },
    affiliateUrl: existingAffiliateUrl,
  });

  const readyDuplicate = updateProductDraft(draft.id, {
    summary: '测试商品摘要，用于验证草稿发布前的必填字段和重复链接校验。',
    bestFor: '自动化校验',
    importStatus: 'ready',
  });
  assert(readyDuplicate.importStatus === 'ready', '草稿应能更新为 ready。');

  let duplicateRejected = false;
  try {
    publishProductDraft(draft.id);
  } catch (error) {
    duplicateRejected = error.statusCode === 400 && error.details?.some((detail) => detail.includes('affiliateUrl'));
  }
  assert(duplicateRejected, '重复 affiliateUrl 应被拒绝。');

  updateProductDraft(draft.id, {
    affiliateUrl: 'https://u.jd.com/testDraftLink',
  });
  const product = publishProductDraft(draft.id);
  assert(product.id === draft.id, 'ready 草稿应能发布为正式商品。');

  const removable = createProductDraft({
    product: {
      skuId: 'test-delete-draft-sku',
      skuName: '测试删除草稿 USB-C Hub',
      price: 199,
      finalPrice: 169,
    },
    affiliateUrl: 'https://u.jd.com/testDeleteDraft',
  });
  const deleted = deleteProductDraft(removable.id);
  assert(deleted.id === removable.id, '草稿应能被删除。');

  console.log('商品草稿校验通过。');
} finally {
  restore(productFile, productsSnapshot);
  restore(draftFile, draftsSnapshot);
}
