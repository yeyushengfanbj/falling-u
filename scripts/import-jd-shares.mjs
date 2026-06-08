import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const inputFile = path.resolve(args.find((arg) => !arg.startsWith('--')) ?? 'imports/jd-shares.txt');
const outputArg = process.argv.find((arg) => arg.startsWith('--out='));
const outputFile = path.resolve(outputArg ? outputArg.slice('--out='.length) : 'imports/product-drafts.json');
const productFile = path.resolve('src/data/products.json');

function readJsonArray(file) {
  if (!fs.existsSync(file)) {
    return [];
  }

  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Array.isArray(parsed) ? parsed : [];
}

function parsePrice(value) {
  if (!value) {
    return undefined;
  }

  const number = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function createHash(value) {
  return crypto.createHash('sha1').update(value).digest('hex').slice(0, 8);
}

function inferCategory(title) {
  if (/显示器|屏幕|电视|投影/i.test(title)) {
    return 'monitors';
  }

  if (/扩展坞|拓展坞|Type-?C|USB-?C|Hub|读卡|键盘|鼠标|充电器|数据线|线材/i.test(title)) {
    return 'mac-accessories';
  }

  if (/NAS|硬盘|路由|Wi-?Fi|交换机|网口|2\.5G|存储/i.test(title)) {
    return 'nas-network';
  }

  if (/椅|桌|床垫|升降桌|办公/i.test(title)) {
    return 'office';
  }

  if (/灯|宿舍|卧室|厨房|家用|日用|小夜灯|收纳/i.test(title)) {
    return 'daily-goods';
  }

  return 'daily-goods';
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

function inferTypeSlug(title) {
  const typeLabel = inferTypeLabel(title);

  if (typeLabel.includes('显示器')) return 'monitor';
  if (typeLabel.includes('Hub')) return 'dock';
  if (typeLabel.includes('硬盘')) return 'drive';
  if (typeLabel.includes('路由器')) return 'router';
  if (typeLabel.includes('椅')) return 'chair';
  if (typeLabel.includes('灯')) return 'lamp';
  return 'jd';
}

function inferSpecs(title, typeLabel) {
  const specs = [];
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
    /声控/g
  ];

  for (const pattern of patterns) {
    const matches = title.match(pattern) ?? [];
    specs.push(...matches.map((item) => item.replace(/\s+/g, ' ').trim()));
  }

  return unique(specs).slice(0, 4).length > 0 ? unique(specs).slice(0, 4) : [typeLabel];
}

function createName(title, typeLabel) {
  const cleaned = title
    .replace(/^【京东】/, '')
    .replace(/【[^】]+】/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= 28) {
    return cleaned;
  }

  const brandMatch = cleaned.match(/^([A-Za-z0-9\u4e00-\u9fa5（）()]+)[\s-]*/);
  const brand = brandMatch ? brandMatch[1].slice(0, 12) : '';
  return unique([brand, typeLabel]).join(' ').slice(0, 28);
}

function createPriceBand(finalPrice) {
  if (!finalPrice) {
    return '待补充';
  }

  if (finalPrice < 50) return '50 元以内';
  if (finalPrice < 200) return '约 100-200 元';
  if (finalPrice < 500) return '约 200-500 元';
  if (finalPrice < 1000) return '约 500-1000 元';
  if (finalPrice < 2000) return '约 1000-2000 元';
  return '2000 元以上';
}

function splitBlocks(text) {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  const jdBlocks = normalized.match(/【京东】[\s\S]*?(?=\n\s*【京东】|$)/g);

  if (jdBlocks?.length) {
    return jdBlocks;
  }

  return normalized
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter((block) => block.includes('u.jd.com'));
}

function parseBlock(block) {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^[-—]{3,}$/.test(line));
  const titleLine = lines.find((line) => line.startsWith('【京东】')) ?? lines[0] ?? '';
  const jdTitle = titleLine.replace(/^【京东】/, '').trim();
  const jdPrice = parsePrice(block.match(/京东价[：:]\s*¥?\s*([\d,.]+)/)?.[1]);
  const finalPrice = parsePrice(block.match(/(?:到手价|券后价|抢购价)[：:]\s*¥?\s*([\d,.]+)/)?.[1]) ?? jdPrice;
  const affiliateUrl = block.match(/https:\/\/u\.jd\.com\/[A-Za-z0-9]+/)?.[0];
  const itemUrl = block.match(/https:\/\/item\.jd\.com\/(\d+)\.html/)?.[0];
  const jdSku = itemUrl?.match(/\/(\d+)\.html/)?.[1];

  if (!jdTitle || !affiliateUrl || !jdPrice || !finalPrice) {
    return {
      error: `无法解析商品块：${jdTitle || block.slice(0, 40)}`
    };
  }

  const category = inferCategory(jdTitle);
  const typeLabel = inferTypeLabel(jdTitle);
  const specs = inferSpecs(jdTitle, typeLabel);
  const hash = createHash(`${jdTitle}${affiliateUrl}`);
  const id = `${inferTypeSlug(jdTitle)}-${jdSku ?? hash}`;
  const name = createName(jdTitle, typeLabel);

  return {
    draft: {
      id,
      category,
      name,
      jdTitle,
      ...(jdSku ? { jdSku } : {}),
      ...(itemUrl ? { jdItemUrl: itemUrl } : {}),
      summary: `待补充：${name}，需要补充核心卖点、适合场景和注意事项。`,
      bestFor: '待补充',
      priceBand: createPriceBand(finalPrice),
      jdPrice,
      finalPrice,
      affiliateUrl,
      typeLabel,
      specs,
      tags: unique([...specs, typeLabel, category]),
      importStatus: 'draft',
      importNotes: ['请复核分类、名称、摘要、适合场景、规格和商品图后再合并到正式商品库。']
    }
  };
}

if (!fs.existsSync(inputFile)) {
  console.error(`没有找到导入文件：${path.relative(process.cwd(), inputFile)}`);
  console.error('把京东推广文案批量放到 imports/jd-shares.txt 后运行 npm run import:jd。');
  process.exit(1);
}

const inputText = fs.readFileSync(inputFile, 'utf8');
const blocks = splitBlocks(inputText);
const products = readJsonArray(productFile);
const existingDrafts = readJsonArray(outputFile);
const usedAffiliateUrls = new Set([
  ...products.map((product) => product.affiliateUrl),
  ...existingDrafts.map((product) => product.affiliateUrl)
]);
const usedIds = new Set([...products.map((product) => product.id), ...existingDrafts.map((product) => product.id)]);
const drafts = [...existingDrafts];
const errors = [];
let skipped = 0;

for (const block of blocks) {
  const parsed = parseBlock(block);

  if (parsed.error) {
    errors.push(parsed.error);
    continue;
  }

  const draft = parsed.draft;

  if (usedAffiliateUrls.has(draft.affiliateUrl)) {
    skipped += 1;
    continue;
  }

  let id = draft.id;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${draft.id}-${suffix}`;
    suffix += 1;
  }

  draft.id = id;
  usedIds.add(id);
  usedAffiliateUrls.add(draft.affiliateUrl);
  drafts.push(draft);
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(drafts, null, 2)}\n`);

console.log('京东推广文案导入完成：');
console.log(`- 解析块数：${blocks.length}`);
console.log(`- 新增草稿：${drafts.length - existingDrafts.length}`);
console.log(`- 跳过重复：${skipped}`);
console.log(`- 草稿文件：${path.relative(process.cwd(), outputFile)}`);

if (errors.length > 0) {
  console.log('- 需要人工处理：');
  for (const error of errors) {
    console.log(`  - ${error}`);
  }
}
