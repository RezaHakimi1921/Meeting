/**
 * Date Invite + Telegram personal-link bridge.
 *
 * Env (server only):
 *   TELEGRAM_BOT_TOKEN=
 *   PUBLIC_BASE_URL=http://94.182.92.79/meeting
 *   BOT_USERNAME=Meetingir_mir_bot
 *   NOTIFY_PORT=3847
 *   INVITES_FILE=/home/cursor/meeting-notify/invites.json
 *
 * Flow:
 *   1) User opens bot and sends /start → gets personal link ?i=CODE
 *   2) Guest opens that link and completes invite
 *   3) POST /notify with inviteId → Telegram message to the link owner
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const PORT = Number(process.env.NOTIFY_PORT || 3847);
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const PUBLIC_BASE = (process.env.PUBLIC_BASE_URL || 'http://94.182.92.79/meeting').replace(/\/$/, '');
const BOT_USERNAME = (process.env.BOT_USERNAME || 'Meetingir_mir_bot').replace(/^@/, '');
const PROXY = process.env.TELEGRAM_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
// Cloudflare Worker (or any reverse proxy) base — no trailing slash.
// Example: https://telegram-proxy.xxxx.workers.dev
const API_BASE = (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/$/, '');
const INVITES_FILE =
  process.env.INVITES_FILE || path.join(__dirname, 'invites.json');

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

function loadStore() {
  try {
    if (!fs.existsSync(INVITES_FILE)) {
      return { byCode: {}, byChat: {} };
    }
    const data = JSON.parse(fs.readFileSync(INVITES_FILE, 'utf8'));
    return {
      byCode: data.byCode || {},
      byChat: data.byChat || {},
    };
  } catch {
    return { byCode: {}, byChat: {} };
  }
}

function saveStore(store) {
  fs.writeFileSync(INVITES_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function makeCode() {
  return crypto.randomBytes(5).toString('hex'); // 10 chars
}

function inviteUrl(code) {
  return `${PUBLIC_BASE}?i=${encodeURIComponent(code)}`;
}

function ensureInviteForChat(chatId, from = {}) {
  const store = loadStore();
  const chatKey = String(chatId);
  let code = store.byChat[chatKey];
  if (code && store.byCode[code]) {
    store.byCode[code].username = from.username || store.byCode[code].username || '';
    store.byCode[code].firstName = from.first_name || store.byCode[code].firstName || '';
    store.byCode[code].updatedAt = new Date().toISOString();
    saveStore(store);
    return { code, created: false, record: store.byCode[code] };
  }
  code = makeCode();
  while (store.byCode[code]) code = makeCode();
  const record = {
    chatId: chatKey,
    username: from.username || '',
    firstName: from.first_name || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.byCode[code] = record;
  store.byChat[chatKey] = code;
  saveStore(store);
  return { code, created: true, record };
}

async function tg(method, body) {
  if (!TOKEN) {
    const err = new Error('TELEGRAM_BOT_TOKEN missing');
    err.code = 'NO_CREDENTIALS';
    throw err;
  }
  const url = `${API_BASE}/bot${TOKEN}/${method}`;
  const payload = JSON.stringify(body || {});

  // Prefer curl when proxy is configured (common on restricted networks).
  if (PROXY) {
    const data = await curlJson(url, payload);
    if (data.ok === false) {
      const err = new Error(data.description || `Telegram ${method} failed`);
      err.code = 'TELEGRAM_ERROR';
      throw err;
    }
    return data;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      const err = new Error(data.description || `Telegram ${method} failed`);
      err.code = 'TELEGRAM_ERROR';
      throw err;
    }
    return data;
  } catch (e) {
    // Fallback to curl (sometimes works when node fetch/DNS fails differently)
    const data = await curlJson(url, payload);
    if (data.ok === false) {
      const err = new Error(data.description || e.message);
      err.code = 'TELEGRAM_ERROR';
      throw err;
    }
    return data;
  }
}

function curlJson(url, payload) {
  return new Promise((resolve, reject) => {
    const args = ['-sS', '--max-time', '30', '-X', 'POST', url, '-H', 'Content-Type: application/json', '-d', payload];
    if (PROXY) {
      args.unshift('-x', PROXY);
    }
    const child = spawn('curl', args);
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => {
      out += d.toString();
    });
    child.stderr.on('data', (d) => {
      err += d.toString();
    });
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(err || `curl exit ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(out || '{}'));
      } catch (e) {
        reject(new Error(`bad telegram json: ${out.slice(0, 200)}`));
      }
    });
  });
}

async function sendTelegram(chatId, text) {
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
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

async function handleBotUpdate(update) {
  const msg = update.message || update.edited_message;
  if (!msg || !msg.chat) return;
  const text = (msg.text || '').trim();
  if (!text.startsWith('/start')) return;

  const { code } = ensureInviteForChat(msg.chat.id, msg.from || {});
  const link = inviteUrl(code);
  const reply = [
    'سلام 💕 لینک اختصاصی دعوت‌نامه‌ات آماده‌ست.',
    '',
    'این لینک رو برای کسی که دوست داری بفرست.',
    'وقتی جواب «آره» بده و فرم رو تموم کنه، همینجا برات می‌فرستم.',
    '',
    link,
    '',
    'نکته: فقط کسانی که حداقل یک‌بار به این ربات سر زدن و /start زدن لینک می‌گیرن.',
  ].join('\n');
  await sendTelegram(msg.chat.id, reply);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pollTelegram() {
  if (!TOKEN) {
    console.warn('poll skipped: no token');
    return;
  }
  try {
    await tg('deleteWebhook', { drop_pending_updates: false });
  } catch (e) {
    console.warn('deleteWebhook', e.message);
  }

  let offset = 0;
  console.log(`telegram polling started proxy=${PROXY ? 'yes' : 'no'}`);
  for (;;) {
    try {
      // Use curl for getUpdates — more reliable on restricted DNS/networks than node fetch.
      const data = await curlGetJson(
        `${API_BASE}/bot${TOKEN}/getUpdates?timeout=25&offset=${offset}`
      );
      if (!data.ok) {
        console.warn('getUpdates not ok', data);
        await sleep(3000);
        continue;
      }
      for (const update of data.result || []) {
        offset = update.update_id + 1;
        try {
          await handleBotUpdate(update);
        } catch (e) {
          console.warn('handle update', e.message);
        }
      }
    } catch (e) {
      console.warn('poll error', e.message);
      await sleep(3000);
    }
  }
}

function curlGetJson(url) {
  return new Promise((resolve, reject) => {
    const args = ['-sS', '--max-time', '35', url];
    if (PROXY) args.unshift('-x', PROXY);
    const child = spawn('curl', args);
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => {
      out += d.toString();
    });
    child.stderr.on('data', (d) => {
      err += d.toString();
    });
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(err || `curl exit ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(out || '{}'));
      } catch (e) {
        reject(new Error(`bad telegram json: ${out.slice(0, 200)}`));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  const pathname = url.pathname;

  if (req.method === 'GET' && (pathname === '/health' || pathname === '/notify/health')) {
    return sendJson(res, 200, {
      ok: true,
      configured: Boolean(TOKEN),
      bot: BOT_USERNAME ? `@${BOT_USERNAME}` : null,
    });
  }

  // Validate personal invite code
  const inviteMatch = pathname.match(/^\/(?:notify\/)?invite\/([a-zA-Z0-9_-]+)$/);
  if (req.method === 'GET' && inviteMatch) {
    const code = inviteMatch[1];
    const store = loadStore();
    const record = store.byCode[code];
    if (!record) {
      return sendJson(res, 404, { ok: false, error: 'invite_not_found' });
    }
    return sendJson(res, 200, {
      ok: true,
      inviteId: code,
      ownerName: record.firstName || record.username || '',
    });
  }

  if (req.method === 'POST' && (pathname === '/notify' || pathname === '/')) {
    try {
      const body = await readBody(req);
      const inviteId = body.inviteId || body.i;
      if (!inviteId) {
        return sendJson(res, 400, { ok: false, error: 'inviteId_required' });
      }
      const store = loadStore();
      const record = store.byCode[String(inviteId)];
      if (!record) {
        return sendJson(res, 404, { ok: false, error: 'invite_not_found' });
      }
      const text = buildMessage(body);
      await sendTelegram(record.chatId, text);
      return sendJson(res, 200, { ok: true });
    } catch (e) {
      const status = e.code === 'NO_CREDENTIALS' ? 503 : 502;
      return sendJson(res, status, { ok: false, error: e.message });
    }
  }

  return sendJson(res, 404, { ok: false, error: 'not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(
    `notify listening on 127.0.0.1:${PORT} configured=${Boolean(TOKEN)} bot=@${BOT_USERNAME} api=${API_BASE}`
  );
  pollTelegram().catch((e) => console.error('poll crashed', e));
});
