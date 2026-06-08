function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function getSearchText(product) {
  return normalize([
    product.id,
    product.category,
    product.name,
    product.jdTitle,
    product.summary,
    product.bestFor,
    product.typeLabel,
    ...(product.specs || []),
    ...(product.tags || []),
  ].join(' '));
}

function matchesQuery(product, query) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return true;
  }

  const searchText = getSearchText(product);
  return terms.every((term) => searchText.includes(term));
}

function compareProducts(sort) {
  return (a, b) => {
    if (sort === 'price-asc') {
      return Number(a.finalPrice || 0) - Number(b.finalPrice || 0);
    }

    if (sort === 'price-desc') {
      return Number(b.finalPrice || 0) - Number(a.finalPrice || 0);
    }

    if (sort === 'save-desc') {
      return Number(b.jdPrice - b.finalPrice) - Number(a.jdPrice - a.finalPrice);
    }

    return 0;
  };
}

export function searchProducts(products, options = {}) {
  const category = options.category || 'all';
  const sort = options.sort || 'recommend';
  const offset = Math.max(0, Number(options.offset || 0));
  const limit = Math.min(60, Math.max(1, Number(options.limit || 24)));

  const filtered = products
    .filter((product) => category === 'all' || product.category === category)
    .filter((product) => matchesQuery(product, options.q))
    .sort(compareProducts(sort));

  return {
    total: filtered.length,
    offset,
    limit,
    hasMore: offset + limit < filtered.length,
    products: filtered.slice(offset, offset + limit),
  };
}

