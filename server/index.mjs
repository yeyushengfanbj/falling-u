import http from 'node:http';

import { loadEnv, getServerConfig } from './lib/env.mjs';
import { createJdUnionClient, normalizeJdGoodsResponse } from './lib/jdUnionClient.mjs';
import { readProducts } from './lib/productsRepository.mjs';
import {
  getBearerToken,
  readJsonBody,
  sendJson,
  sendNoContent,
  sendError,
} from './lib/serverHttp.mjs';

loadEnv();

const config = getServerConfig();
const jdUnion = createJdUnionClient(config.jdUnion);

function ensureAdmin(req) {
  if (!config.adminToken) {
    const error = new Error('SERVER_ADMIN_TOKEN is not configured.');
    error.statusCode = 500;
    throw error;
  }

  const token = req.headers['x-admin-token'] || getBearerToken(req.headers.authorization);
  if (token !== config.adminToken) {
    const error = new Error('Unauthorized admin API request.');
    error.statusCode = 401;
    throw error;
  }
}

async function handleAdminGoodsSearch(req, res) {
  ensureAdmin(req);
  const body = await readJsonBody(req);
  const goodsReq = {
    keyword: body.keyword,
    skuIds: body.skuIds,
    pageIndex: body.pageIndex ?? 1,
    pageSize: body.pageSize ?? 20,
    cid1: body.cid1,
    cid2: body.cid2,
    cid3: body.cid3,
    isCoupon: body.isCoupon,
    sortName: body.sortName,
    sort: body.sort,
  };

  Object.keys(goodsReq).forEach((key) => goodsReq[key] === undefined && delete goodsReq[key]);

  const raw = await jdUnion.call('jd.union.open.goods.query', { goodsReq });
  sendJson(res, {
    ok: true,
    raw,
    items: normalizeJdGoodsResponse(raw),
  });
}

async function handleAdminPromotionLink(req, res) {
  ensureAdmin(req);
  const body = await readJsonBody(req);
  const materialId = body.materialId || body.jdItemUrl || body.url;

  if (!materialId) {
    return sendError(res, 400, 'materialId, jdItemUrl, or url is required.');
  }

  const promotionCodeReq = {
    materialId,
    siteId: body.siteId ?? config.jdUnion.siteId,
    positionId: body.positionId ?? config.jdUnion.positionId,
    pid: body.pid ?? config.jdUnion.pid,
    subUnionId: body.subUnionId ?? config.jdUnion.subUnionId,
    couponUrl: body.couponUrl,
    ext1: body.ext1,
  };

  Object.keys(promotionCodeReq).forEach((key) => {
    if (promotionCodeReq[key] === undefined || promotionCodeReq[key] === '') {
      delete promotionCodeReq[key];
    }
  });

  const raw = await jdUnion.call('jd.union.open.promotion.common.get', { promotionCodeReq });
  sendJson(res, { ok: true, raw });
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    return sendNoContent(res);
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, {
      ok: true,
      service: 'falling-u-api',
      time: new Date().toISOString(),
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/products') {
    return sendJson(res, {
      ok: true,
      products: readProducts(),
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/jd/goods/search') {
    return handleAdminGoodsSearch(req, res);
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/jd/promotion/link') {
    return handleAdminPromotionLink(req, res);
  }

  return sendError(res, 404, 'API route not found.');
}

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => {
    console.error(error);
    sendError(res, error.statusCode || 500, error.message || 'Internal server error.');
  });
});

server.listen(config.port, () => {
  console.log(`falling-u API listening on http://127.0.0.1:${config.port}`);
});
