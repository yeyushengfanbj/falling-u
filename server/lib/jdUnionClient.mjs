import crypto from 'node:crypto';

function formatTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    ' ',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
    ':',
    pad(date.getSeconds()),
  ].join('');
}

function createMd5Sign(params, appSecret) {
  const keys = Object.keys(params)
    .filter((key) => key !== 'sign' && params[key] !== undefined && params[key] !== '')
    .sort();

  const raw = `${appSecret}${keys.map((key) => `${key}${params[key]}`).join('')}${appSecret}`;
  return crypto.createHash('md5').update(raw, 'utf8').digest('hex').toUpperCase();
}

function assertCredentials(config) {
  if (!config.appKey || !config.appSecret) {
    const error = new Error('JD_UNION_APP_KEY and JD_UNION_APP_SECRET are required.');
    error.statusCode = 500;
    throw error;
  }
}

function parseMaybeJson(value) {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function unwrapJdUnionResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    return raw;
  }

  const responseKey = Object.keys(raw).find((key) => key.endsWith('_responce') || key.endsWith('_response'));
  const response = responseKey ? raw[responseKey] : raw;

  if (response && typeof response === 'object') {
    for (const key of ['queryResult', 'result', 'data']) {
      if (key in response) {
        return parseMaybeJson(response[key]);
      }
    }
  }

  return parseMaybeJson(response);
}

export function normalizeJdGoodsResponse(raw) {
  const unwrapped = unwrapJdUnionResponse(raw);
  const items = Array.isArray(unwrapped)
    ? unwrapped
    : unwrapped?.data || unwrapped?.goods || unwrapped?.result || [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    skuId: item.skuId || item.sku_id || item.sku,
    skuName: item.skuName || item.name || item.title,
    materialUrl: item.materialUrl || item.itemUrl || item.url,
    imageUrl: item.imageInfo?.imageList?.[0]?.url || item.imageUrl || item.imgUrl,
    price: item.priceInfo?.price || item.price,
    finalPrice: item.priceInfo?.lowestPrice || item.priceInfo?.lowestCouponPrice,
    commissionShare: item.commissionInfo?.commissionShare,
    couponList: item.couponInfo?.couponList || [],
    raw: item,
  }));
}

export function createJdUnionClient(config) {
  return {
    async call(method, payload) {
      assertCredentials(config);

      const params = {
        method,
        app_key: config.appKey,
        timestamp: formatTimestamp(),
        format: 'json',
        v: config.version || '2.0',
        sign_method: 'md5',
        '360buy_param_json': JSON.stringify(payload || {}),
      };

      if (config.accessToken) {
        params.access_token = config.accessToken;
      }

      params.sign = createMd5Sign(params, config.appSecret);

      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        body: new URLSearchParams(params),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (!response.ok) {
        const error = new Error(`JD Union API request failed with HTTP ${response.status}.`);
        error.statusCode = 502;
        error.response = data;
        throw error;
      }

      return data;
    },
  };
}
