export function getBearerToken(authorization = '') {
  const [type, token] = authorization.split(/\s+/);
  return type?.toLowerCase() === 'bearer' ? token : '';
}

export async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error('Request body must be valid JSON.');
    error.statusCode = 400;
    throw error;
  }
}

function setDefaultHeaders(res) {
  res.setHeader('access-control-allow-origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type,authorization,x-admin-token');
}

export function sendJson(res, body, statusCode = 200) {
  setDefaultHeaders(res);
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json;charset=utf-8');
  res.end(JSON.stringify(body, null, 2));
}

export function sendNoContent(res) {
  setDefaultHeaders(res);
  res.statusCode = 204;
  res.end();
}

export function sendError(res, statusCode, message, extra = {}) {
  sendJson(res, { ok: false, error: message, ...extra }, statusCode);
}
