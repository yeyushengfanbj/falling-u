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
  const productId = String(event.productId || '').trim();
  if (!productId) {
    const error = new Error('productId is required.');
    error.statusCode = 400;
    throw error;
  }

  const click = {
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
  const counts = new Map();
  for (const event of readEvents()) {
    counts.set(event.productId, (counts.get(event.productId) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([productId, clicks]) => ({ productId, clicks }))
    .sort((a, b) => b.clicks - a.clicks);
}

