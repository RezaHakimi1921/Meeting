/**
 * Tiny Telegram notify API.
 * Secrets come from env only — never from the client.
 *
 *   TELEGRAM_BOT_TOKEN=...
 *   TELEGRAM_CHAT_ID=...
 *   NOTIFY_PORT=3847
 */
const http = require('http');

const PORT = Number(process.env.NOTIFY_PORT || 3847);
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8') || '{}';
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

async function sendTelegram(text) {
  if (!TOKEN || !CHAT_ID) {
    const err = new Error('Telegram credentials not configured on server');
    err.code = 'NO_CREDENTIALS';
    throw err;
  }
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      disable_web_page_preview: true,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const err = new Error(data.description || `Telegram HTTP ${res.status}`);
    err.code = 'TELEGRAM_ERROR';
    throw err;
  }
  return data;
}

function buildMessage(body) {
  const dateLabel = body?.date?.label || body?.dateLabel || '—';
  const weekday = body?.date?.weekdayFa || '';
  const time = body?.time?.label || body?.timeLabel || '—';
  const order = body?.order?.label || body?.orderLabel || '—';
  const emoji = body?.order?.emoji || '💕';
  return [
    'خبر خوب! جواب مثبت ثبت شد 🎉',
    '',
    `📅 ${weekday} ${dateLabel}`.trim(),
    `⏰ ساعت ${time}`,
    `${emoji} سفارش: ${order}`,
  ].join('\n');
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const path = (req.url || '').split('?')[0];
  if (req.method === 'GET' && (path === '/health' || path === '/notify/health')) {
    return sendJson(res, 200, {
      ok: true,
      configured: Boolean(TOKEN && CHAT_ID),
    });
  }

  if (req.method === 'POST' && (path === '/notify' || path === '/')) {
    try {
      const body = await readBody(req);
      const text = buildMessage(body);
      await sendTelegram(text);
      return sendJson(res, 200, { ok: true });
    } catch (e) {
      const status = e.code === 'NO_CREDENTIALS' ? 503 : 502;
      return sendJson(res, status, { ok: false, error: e.message });
    }
  }

  return sendJson(res, 404, { ok: false, error: 'not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`notify listening on 127.0.0.1:${PORT} configured=${Boolean(TOKEN && CHAT_ID)}`);
});
