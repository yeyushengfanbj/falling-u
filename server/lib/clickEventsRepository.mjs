import fs from 'node:fs';
import path from 'node:path';

const clickFile = path.resolve(process.env.RUNTIME_DIR || 'runtime', 'click-events.json');

function readEvents() {
  if (!fs.existsSync(clickFile)) {
    return [];
  }

  const parsed = JSON.parse(fs.readFileSync(clickFile, 'utf8'));
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed;
}

function writeEvents(events) {
  fs.mkdirSync(path.dirname(clickFile), { recursive: true });
  fs.writeFileSync(clickFile, `${JSON.stringify(events, null, 2)}\n`);
}

export function recordClickEvent(event = {}) {
  return recordProductEvent({ ...event, type: 'click' });
}

export function recordExposureEvent(event = {}) {
  return recordProductEvent({ ...event, type: 'exposure' });
}

export function recordProductEvent(event = {}) {
  const productId = String(event.productId || '').trim();
  if (!productId) {
    const error = new Error('productId is required.');
    error.statusCode = 400;
    throw error;
  }

  const click = {
    type: event.type || 'click',
    productId,
    time: new Date().toISOString(),
    referrer: String(event.referrer || '').slice(0, 500),
    userAgent: String(event.userAgent || '').slice(0, 500),
  };

  const events = readEvents();
  events.push(click);
  writeEvents(events);
  return click;
}

export function summarizeClicks() {
  return summarizeEvents('click');
}

export function summarizeExposures() {
  return summarizeEvents('exposure');
}

function summarizeEvents(type) {
  const counts = new Map();
  for (const event of readEvents()) {
    const eventType = event.type || 'click';
    if (eventType !== type) {
      continue;
    }

    counts.set(event.productId, (counts.get(event.productId) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([productId, clicks]) => ({ productId, clicks }))
    .sort((a, b) => b.clicks - a.clicks);
}
