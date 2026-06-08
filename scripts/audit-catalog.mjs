import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const strict = process.argv.includes('--strict');
const productFile = path.resolve('src/data/products.json');
const siteFile = path.resolve('src/data/site.ts');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readSource(file) {
  const sourceText = fs.readFileSync(file, 'utf8');
  return ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true);
}

function findVariableInitializer(sourceFile, variableName) {
  let result;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName &&
      node.initializer
    ) {
      result = node.initializer;
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return result;
}

function getProperty(objectNode, propertyName) {
  if (!ts.isObjectLiteralExpression(objectNode)) {
    return undefined;
  }

  const property = objectNode.properties.find((item) => {
    if (!ts.isPropertyAssignment(item)) {
      return false;
    }

    const name = item.name;
    return (
      (ts.isIdentifier(name) && name.text === propertyName) ||
      (ts.isStringLiteral(name) && name.text === propertyName)
    );
  });

  return property && ts.isPropertyAssignment(property) ? property.initializer : undefined;
}

function getStringProperty(objectNode, propertyName) {
  const value = getProperty(objectNode, propertyName);
  return value && (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) ? value.text : undefined;
}

function getNumberProperty(objectNode, propertyName) {
  const value = getProperty(objectNode, propertyName);
  return value && ts.isNumericLiteral(value) ? Number(value.text) : undefined;
}

const siteSource = readSource(siteFile);
const categoriesNode = findVariableInitializer(siteSource, 'categories');
const targetsNode = findVariableInitializer(siteSource, 'catalogTargets');
const products = readJson(productFile);

if (!Array.isArray(products)) {
  console.error('src/data/products.json 必须是商品数组。');
  process.exit(1);
}

if (!categoriesNode || !ts.isArrayLiteralExpression(categoriesNode)) {
  console.error('没有找到 src/data/site.ts 里的 categories 数组。');
  process.exit(1);
}

if (!targetsNode || !ts.isObjectLiteralExpression(targetsNode)) {
  console.error('没有找到 src/data/site.ts 里的 catalogTargets 配置。');
  process.exit(1);
}

const categories = categoriesNode.elements
  .filter(ts.isObjectLiteralExpression)
  .map((category) => ({
    slug: getStringProperty(category, 'slug'),
    name: getStringProperty(category, 'name')
  }))
  .filter((category) => category.slug && category.name);
const firstStageTotal = getNumberProperty(targetsNode, 'firstStageTotal') ?? 30;
const perCategoryMinimum = getNumberProperty(targetsNode, 'perCategoryMinimum') ?? 6;
const productsByCategory = new Map(categories.map((category) => [category.slug, 0]));
const unknownCategoryProducts = [];

for (const product of products) {
  const id = typeof product.id === 'string' ? product.id : 'unknown';
  const category = typeof product.category === 'string' ? product.category : undefined;

  if (!category || !productsByCategory.has(category)) {
    unknownCategoryProducts.push(id);
    continue;
  }

  productsByCategory.set(category, (productsByCategory.get(category) ?? 0) + 1);
}

const totalGap = Math.max(0, firstStageTotal - products.length);
const categoryRows = categories.map((category) => {
  const count = productsByCategory.get(category.slug) ?? 0;
  const gap = Math.max(0, perCategoryMinimum - count);
  return { ...category, count, gap };
});
const categoryGap = categoryRows.reduce((sum, row) => sum + row.gap, 0);
const hasGap = totalGap > 0 || categoryGap > 0 || unknownCategoryProducts.length > 0;

console.log('商品库审计：');
console.log(`- 当前商品：${products.length} 件`);
console.log(`- 第一阶段目标：${firstStageTotal} 件，缺口 ${totalGap} 件`);
console.log(`- 每个分类最低目标：${perCategoryMinimum} 件`);

for (const row of categoryRows) {
  const status = row.gap === 0 ? '达标' : `还缺 ${row.gap} 件`;
  console.log(`- ${row.name} (${row.slug})：${row.count} 件，${status}`);
}

if (unknownCategoryProducts.length > 0) {
  console.log(`- 未知分类商品：${unknownCategoryProducts.join(', ')}`);
}

if (hasGap && strict) {
  console.error('商品库未达到阶段目标。');
  process.exit(1);
}
