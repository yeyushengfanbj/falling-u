import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { readProducts, writeProducts } from './productsRepository.mjs';

const draftFile = path.resolve('imports/product-drafts.json');
const validCategories = new Set(['monitors', 'mac-accessories', 'nas-network', 'office', 'daily-goods']);

function readJsonArray(file) {
  if (!fs.existsSync(file)) {
    return [];
  }

  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error(`${path.relative(process.cwd(), file)} must be an array.`);
  }

  return parsed;
}

function writeJsonArray(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function unique(values) {
  return [...new Set(values.map(normalizeText).filter(Boolean))];
}

function hash(value) {
  return crypto.createHash('sha1').update(value).digest('hex').slice(0, 8);
}

function inferTypeLabel(title) {
  if (/显示器|屏幕/i.test(title)) return /4K/i.test(title) ? '4K 显示器' : '显示器';
  if (/扩展坞|拓展坞|Hub/i.test(title)) return 'USB-C Hub';
  if (/硬盘|NAS/i.test(title)) return 'NAS 硬盘';
  if (/路由|Wi-?Fi/i.test(title)) return /Wi-?Fi\s*7|WiFi7/i.test(title) ? 'WiFi7 路由器' : '路由器';
  if (/椅/i.test(title)) return '人体工学椅';
  if (/灯/i.test(title)) return '小夜灯';
  return '京东商品';
}

function inferCategory(title) {
  if (/显示器|屏幕|电视|投影/i.test(title)) return 'monitors';
  if (/扩展坞|拓展坞|Type-?C|USB-?C|Hub|读卡|键盘|鼠标|充电器|数据线|线材/i.test(title)) return 'mac-accessories';
  if (/NAS|硬盘|路由|Wi-?Fi|交换机|网口|2\.5G|存储/i.test(title)) return 'nas-network';
  if (/椅|桌|床垫|升降桌|办公/i.test(title)) return 'office';
  return 'daily-goods';
}

function inferSpecs(title, typeLabel) {
  const patterns = [
    /\d+(?:\.\d+)?\s*英寸/gi,
    /\d+(?:\.\d+)?\s*TB/gi,
    /Wi-?Fi\s*\d/gi,
    /\d+(?:\.\d+)?G\s*(?:口|网口)?/gi,
    /USB-?C|Type-?C/gi,
    /\d+\s*合一/gi,
    /\d+D\s*腰托/gi,
    /4K/gi,
    /SATA/gi,
    /7200\s*转/gi,
    /升降旋转/g,
    /TF\/SD/gi,
    /光控款/g,
    /声控/g,
  ];
  const specs = patterns.flatMap((pattern) => title.match(pattern) ?? []);
  return unique(specs).slice(0, 4).length > 0 ? unique(specs).slice(0, 4) : [typeLabel];
}

function createPriceBand(price) {
  if (!price) return '待补充';
  if (price < 50) return '50 元以内';
  if (price < 200) return '约 100-200 元';
  if (price < 500) return '约 200-500 元';
  if (price < 1000) return '约 500-1000 元';
  if (price < 2000) return '约 1000-2000 元';
  return '2000 元以上';
}

function createName(title, typeLabel) {
  const cleaned = normalizeText(title)
    .replace(/^【京东】/, '')
    .replace(/【[^】]+】/g, '')
    .replace(/\s+/g, ' ');

  if (cleaned.length <= 28) {
    return cleaned;
  }

  const brand = cleaned.match(/^([A-Za-z0-9\u4e00-\u9fa5（）()]+)/)?.[1]?.slice(0, 12) ?? '';
  return unique([brand, typeLabel]).join(' ').slice(0, 28);
}

function createDraftId(candidate) {
  const title = candidate.jdTitle || candidate.skuName || candidate.name || candidate.title || 'jd-product';
  const sku = candidate.jdSku || candidate.skuId || candidate.sku;
  const prefix = inferTypeLabel(title).includes('显示器')
    ? 'monitor'
    : inferTypeLabel(title).includes('Hub')
      ? 'dock'
      : inferTypeLabel(title).includes('硬盘')
        ? 'drive'
        : inferTypeLabel(title).includes('路由器')
          ? 'router'
          : inferTypeLabel(title).includes('椅')
            ? 'chair'
            : inferTypeLabel(title).includes('灯')
              ? 'lamp'
              : 'jd';

  return `${prefix}-${sku || hash(`${title}${Date.now()}`)}`;
}

function publicProductFromDraft(draft) {
  const {
    importStatus,
    importNotes,
    source,
    raw,
    createdAt,
    updatedAt,
    reviewedAt,
    publishedAt,
    ...product
  } = draft;

  return product;
}

export function readDrafts() {
  return readJsonArray(draftFile);
}

export function writeDrafts(drafts) {
  writeJsonArray(draftFile, drafts);
}

export function createProductDraft(input = {}) {
  const candidate = input.product || input.candidate || input;
  const title = normalizeText(candidate.jdTitle || candidate.skuName || candidate.name || candidate.title);
  const typeLabel = normalizeText(candidate.typeLabel) || inferTypeLabel(title);
  const finalPrice = toNumber(candidate.finalPrice ?? candidate.priceInfo?.lowestPrice ?? candidate.price);
  const jdPrice = toNumber(candidate.jdPrice ?? candidate.price ?? finalPrice);
  const affiliateUrl = normalizeText(input.affiliateUrl || candidate.affiliateUrl || input.promotion?.shortUrl || input.promotion?.clickUrl);
  const jdSku = normalizeText(candidate.jdSku || candidate.skuId || candidate.sku);
  const materialUrl = normalizeText(candidate.jdItemUrl || candidate.materialUrl || candidate.itemUrl || candidate.url);
  const now = new Date().toISOString();
  const draft = {
    id: normalizeText(candidate.id) || createDraftId(candidate),
    category: normalizeText(candidate.category) || inferCategory(title),
    name: normalizeText(candidate.name) || createName(title, typeLabel),
    jdTitle: title,
    ...(jdSku ? { jdSku } : {}),
    ...(materialUrl ? { jdItemUrl: materialUrl } : {}),
    summary: normalizeText(candidate.summary) || `待补充：${createName(title, typeLabel)}，需要补充核心卖点、适合场景和注意事项。`,
    bestFor: normalizeText(candidate.bestFor) || '待补充',
    priceBand: normalizeText(candidate.priceBand) || createPriceBand(finalPrice),
    jdPrice: jdPrice ?? 0,
    finalPrice: finalPrice ?? jdPrice ?? 0,
    affiliateUrl,
    ...(candidate.image || candidate.imageUrl ? { image: normalizeText(candidate.image || candidate.imageUrl) } : {}),
    typeLabel,
    specs: unique(Array.isArray(candidate.specs) ? candidate.specs : inferSpecs(title, typeLabel)),
    tags: unique([...(Array.isArray(candidate.tags) ? candidate.tags : []), typeLabel, inferCategory(title)]),
    importStatus: normalizeText(candidate.importStatus) || 'draft',
    importNotes: Array.isArray(candidate.importNotes)
      ? candidate.importNotes
      : ['请复核分类、名称、摘要、适合场景、规格、商品图和推广链接后再发布。'],
    source: input.source || 'admin-api',
    raw: candidate.raw || candidate,
    createdAt: now,
    updatedAt: now,
  };

  const drafts = readDrafts();
  const products = readProducts();
  const usedIds = new Set([...drafts.map((item) => item.id), ...products.map((item) => item.id)]);
  let nextId = draft.id;
  let suffix = 2;
  while (usedIds.has(nextId)) {
    nextId = `${draft.id}-${suffix}`;
    suffix += 1;
  }
  draft.id = nextId;
  drafts.push(draft);
  writeDrafts(drafts);
  return draft;
}

export function updateProductDraft(id, patch = {}) {
  const drafts = readDrafts();
  const index = drafts.findIndex((draft) => draft.id === id);
  if (index === -1) {
    const error = new Error(`Draft not found: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  const allowed = [
    'id',
    'category',
    'name',
    'jdTitle',
    'jdSku',
    'jdItemUrl',
    'summary',
    'bestFor',
    'priceBand',
    'jdPrice',
    'finalPrice',
    'affiliateUrl',
    'image',
    'typeLabel',
    'specs',
    'tags',
    'importStatus',
    'importNotes',
  ];
  const next = { ...drafts[index] };

  for (const key of allowed) {
    if (key in patch) {
      next[key] = patch[key];
    }
  }

  next.jdPrice = toNumber(next.jdPrice) ?? 0;
  next.finalPrice = toNumber(next.finalPrice) ?? 0;
  next.specs = unique(Array.isArray(next.specs) ? next.specs : String(next.specs || '').split(/[,，\n]/));
  next.tags = unique(Array.isArray(next.tags) ? next.tags : String(next.tags || '').split(/[,，\n]/));
  next.importNotes = Array.isArray(next.importNotes)
    ? next.importNotes.map(normalizeText).filter(Boolean)
    : String(next.importNotes || '').split(/\n/).map(normalizeText).filter(Boolean);
  next.updatedAt = new Date().toISOString();
  if (next.importStatus === 'ready' && drafts[index].importStatus !== 'ready') {
    next.reviewedAt = next.updatedAt;
  }

  drafts[index] = next;
  writeDrafts(drafts);
  return next;
}

export function deleteProductDraft(id) {
  const drafts = readDrafts();
  const draft = drafts.find((item) => item.id === id);
  if (!draft) {
    const error = new Error(`Draft not found: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  writeDrafts(drafts.filter((item) => item.id !== id));
  return draft;
}

export function validatePublishableDraft(draft) {
  const errors = [];
  const requiredText = ['id', 'category', 'name', 'jdTitle', 'summary', 'bestFor', 'priceBand', 'affiliateUrl', 'typeLabel'];

  for (const key of requiredText) {
    if (!normalizeText(draft[key])) {
      errors.push(`${key} is required`);
    }
  }

  if (!validCategories.has(draft.category)) {
    errors.push(`category must be one of: ${[...validCategories].join(', ')}`);
  }

  if (!/^https:\/\/u\.jd\.com\/[A-Za-z0-9]+/.test(draft.affiliateUrl || '')) {
    errors.push('affiliateUrl must be a JD Union short link.');
  }

  if (!Number.isFinite(Number(draft.jdPrice)) || Number(draft.jdPrice) <= 0) {
    errors.push('jdPrice must be greater than 0');
  }

  if (!Number.isFinite(Number(draft.finalPrice)) || Number(draft.finalPrice) <= 0) {
    errors.push('finalPrice must be greater than 0');
  }

  if (!Array.isArray(draft.specs) || draft.specs.length === 0) {
    errors.push('specs must include at least one item');
  }

  if (!Array.isArray(draft.tags)) {
    errors.push('tags must be an array');
  }

  if (draft.importStatus !== 'ready') {
    errors.push('importStatus must be ready before publishing');
  }

  return errors;
}

export function publishProductDraft(id) {
  const drafts = readDrafts();
  const draft = drafts.find((item) => item.id === id);
  if (!draft) {
    const error = new Error(`Draft not found: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  const errors = validatePublishableDraft(draft);
  const products = readProducts();
  if (products.some((product) => product.id === draft.id)) {
    errors.push('id already exists in public catalog');
  }
  if (products.some((product) => product.affiliateUrl === draft.affiliateUrl)) {
    errors.push('affiliateUrl already exists in public catalog');
  }

  if (errors.length > 0) {
    const error = new Error('Draft is not publishable.');
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  const product = publicProductFromDraft({
    ...draft,
    publishedAt: new Date().toISOString(),
  });
  writeProducts([...products, product]);
  writeDrafts(drafts.filter((item) => item.id !== id));
  return product;
}
