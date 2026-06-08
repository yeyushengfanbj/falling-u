import http from 'node:http';

import { loadEnv, getServerConfig } from './lib/env.mjs';
import { createJdUnionClient, normalizeJdGoodsResponse, normalizePromotionResponse } from './lib/jdUnionClient.mjs';
import { readProducts } from './lib/productsRepository.mjs';
import { searchProducts } from './lib/productSearch.mjs';
import {
  createProductDraft,
  deleteProductDraft,
  publishProductDraft,
  readDrafts,
  updateProductDraft,
} from './lib/productDraftsRepository.mjs';
import {
  recordClickEvent,
  recordExposureEvent,
  summarizeClicks,
  summarizeExposures,
} from './lib/clickEventsRepository.mjs';
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
  sendJson(res, { ok: true, promotion: normalizePromotionResponse(raw), raw });
}

async function handleCreateDraft(req, res) {
  ensureAdmin(req);
  const body = await readJsonBody(req);
  const draft = createProductDraft(body);
  sendJson(res, { ok: true, draft }, 201);
}

async function handleUpdateDraft(req, res, id) {
  ensureAdmin(req);
  const body = await readJsonBody(req);
  const draft = updateProductDraft(id, body);
  sendJson(res, { ok: true, draft });
}

async function handleDeleteDraft(req, res, id) {
  ensureAdmin(req);
  const draft = deleteProductDraft(id);
  sendJson(res, { ok: true, draft });
}

async function handlePublishDraft(req, res, id) {
  ensureAdmin(req);
  const product = publishProductDraft(id);
  sendJson(res, { ok: true, product });
}

async function handleRecordClick(req, res) {
  const body = await readJsonBody(req);
  const click = recordClickEvent({
    productId: body.productId,
    referrer: body.referrer || req.headers.referer,
    userAgent: body.userAgent || req.headers['user-agent'],
  });
  sendJson(res, { ok: true, click }, 201);
}

async function handleRecordExposure(req, res) {
  const body = await readJsonBody(req);
  const exposure = recordExposureEvent({
    productId: body.productId,
    referrer: body.referrer || req.headers.referer,
    userAgent: body.userAgent || req.headers['user-agent'],
  });
  sendJson(res, { ok: true, exposure }, 201);
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    return sendNoContent(res);
  }

  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, {
      ok: true,
      service: 'falling-u-api',
      time: new Date().toISOString(),
    });
  }

  if (req.method === 'GET' && pathname === '/api/products') {
    return sendJson(res, {
      ok: true,
      products: readProducts(),
    });
  }

  if (req.method === 'GET' && pathname === '/api/products/search') {
    return sendJson(res, {
      ok: true,
      ...searchProducts(readProducts(), {
        q: url.searchParams.get('q'),
        category: url.searchParams.get('category') || 'all',
        sort: url.searchParams.get('sort') || 'recommend',
        offset: url.searchParams.get('offset') || 0,
        limit: url.searchParams.get('limit') || 24,
      }),
    });
  }

  if (req.method === 'POST' && pathname === '/api/admin/jd/goods/search') {
    return handleAdminGoodsSearch(req, res);
  }

  if (req.method === 'POST' && pathname === '/api/admin/jd/promotion/link') {
    return handleAdminPromotionLink(req, res);
  }

  if (req.method === 'GET' && pathname === '/api/admin/products/drafts') {
    ensureAdmin(req);
    return sendJson(res, { ok: true, drafts: readDrafts() });
  }

  if (req.method === 'POST' && pathname === '/api/admin/products/drafts') {
    return handleCreateDraft(req, res);
  }

  const draftMatch = pathname.match(/^\/api\/admin\/products\/drafts\/([^/]+)$/);
  if (req.method === 'PATCH' && draftMatch) {
    return handleUpdateDraft(req, res, decodeURIComponent(draftMatch[1]));
  }

  if (req.method === 'DELETE' && draftMatch) {
    return handleDeleteDraft(req, res, decodeURIComponent(draftMatch[1]));
  }

  const publishMatch = pathname.match(/^\/api\/admin\/products\/drafts\/([^/]+)\/publish$/);
  if (req.method === 'POST' && publishMatch) {
    return handlePublishDraft(req, res, decodeURIComponent(publishMatch[1]));
  }

  if (req.method === 'POST' && pathname === '/api/clicks') {
    return handleRecordClick(req, res);
  }

  if (req.method === 'POST' && pathname === '/api/exposures') {
    return handleRecordExposure(req, res);
  }

  if (req.method === 'GET' && pathname === '/api/admin/clicks/summary') {
    ensureAdmin(req);
    return sendJson(res, { ok: true, summary: summarizeClicks(), exposures: summarizeExposures() });
  }

  return sendError(res, 404, 'API route not found.');
}

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => {
    console.error(error);
    sendError(res, error.statusCode || 500, error.message || 'Internal server error.', {
      ...(error.details ? { details: error.details } : {}),
      ...(error.response ? { upstream: error.response } : {}),
    });
  });
});

server.listen(config.port, () => {
  console.log(`falling-u API listening on http://127.0.0.1:${config.port}`);
});
