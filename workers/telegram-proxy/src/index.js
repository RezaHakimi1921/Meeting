/**
 * Telegram bridge for Date Invite
 * - /bot*           → reverse proxy to api.telegram.org
 * - GET /invite/:id → validate personal invite
 * - POST /notify    → send completion message to invite owner
 * - Cron            → poll getUpdates and answer /start with personal link
 *
 * Secrets/vars (Dashboard → Settings):
 *   TELEGRAM_BOT_TOKEN
 *   PUBLIC_BASE_URL   e.g. http://94.182.92.79/meeting
 *   BOT_USERNAME      e.g. Meetingir_mir_bot
 *
 * KV binding name: INVITES
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/bot')) {
      return proxyTelegram(request, url);
    }

    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }));
    }

    if (request.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
      return cors(json({ ok: true, service: 'meeting-telegram-bridge' }));
    }

    const inviteMatch = url.pathname.match(/^\/invite\/([a-zA-Z0-9_-]+)$/);
    if (request.method === 'GET' && inviteMatch) {
      return cors(await getInvite(env, inviteMatch[1]));
    }

    if (request.method === 'POST' && url.pathname === '/notify') {
      return cors(await handleNotify(request, env));
    }

    return cors(new Response('Not found', { status: 404 }));
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(pollUpdates(env));
  },
};

async function proxyTelegram(request, url) {
  if (!url.pathname.startsWith('/bot')) {
    return new Response('Not allowed', { status: 403 });
  }
  const telegramUrl = 'https://api.telegram.org' + url.pathname + url.search;
  const init = {
    method: request.method,
    headers: request.headers,
    redirect: 'follow',
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }
  const response = await fetch(telegramUrl, init);
  const headers = new Headers(response.headers);
  headers.delete('content-encoding');
  headers.delete('transfer-encoding');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function cors(res) {
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function token(env) {
  return env.TELEGRAM_BOT_TOKEN || '';
}

function publicBase(env) {
  return (env.PUBLIC_BASE_URL || 'http://94.182.92.79/meeting').replace(/\/$/, '');
}

async function tg(env, method, body) {
  const t = token(env);
  if (!t) throw new Error('TELEGRAM_BOT_TOKEN missing');
  const res = await fetch(`https://api.telegram.org/bot${t}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  return res.json();
}

function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function ensureInvite(env, chatId, from = {}) {
  const chatKey = String(chatId);
  const existing = await env.INVITES.get(`chat:${chatKey}`, 'json');
  if (existing?.code) {
    const record = (await env.INVITES.get(`code:${existing.code}`, 'json')) || {};
    record.username = from.username || record.username || '';
    record.firstName = from.first_name || record.firstName || '';
    record.updatedAt = new Date().toISOString();
    await env.INVITES.put(`code:${existing.code}`, JSON.stringify(record));
    return existing.code;
  }
  let code = makeCode();
  while (await env.INVITES.get(`code:${code}`)) code = makeCode();
  const record = {
    chatId: chatKey,
    username: from.username || '',
    firstName: from.first_name || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await env.INVITES.put(`code:${code}`, JSON.stringify(record));
  await env.INVITES.put(`chat:${chatKey}`, JSON.stringify({ code }));
  return code;
}

async function getInvite(env, code) {
  const record = await env.INVITES.get(`code:${code}`, 'json');
  if (!record) return json({ ok: false, error: 'invite_not_found' }, 404);
  return json({
    ok: true,
    inviteId: code,
    ownerName: record.firstName || record.username || '',
  });
}

async function handleNotify(request, env) {
  try {
    const body = await request.json();
    const inviteId = body.inviteId || body.i;
    if (!inviteId) return json({ ok: false, error: 'inviteId_required' }, 400);
    const record = await env.INVITES.get(`code:${String(inviteId)}`, 'json');
    if (!record) return json({ ok: false, error: 'invite_not_found' }, 404);

    const dateLabel = body?.date?.label || '—';
    const weekday = body?.date?.weekdayFa || '';
    const time = body?.time?.label || '—';
    const order = body?.order?.label || '—';
    const emoji = body?.order?.emoji || '💕';
    const text = [
      'خبر خوب! جواب مثبت ثبت شد 🎉',
      '',
      `📅 ${weekday} ${dateLabel}`.trim(),
      `⏰ ساعت ${time}`,
      `${emoji} سفارش: ${order}`,
    ].join('\n');

    const result = await tg(env, 'sendMessage', {
      chat_id: record.chatId,
      text,
      disable_web_page_preview: true,
    });
    if (!result.ok) return json({ ok: false, error: result.description || 'telegram_error' }, 502);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: e.message || 'error' }, 500);
  }
}

async function pollUpdates(env) {
  if (!token(env) || !env.INVITES) return;
  const offsetRaw = await env.INVITES.get('meta:update_offset');
  let offset = offsetRaw ? Number(offsetRaw) : 0;
  const data = await tg(env, 'getUpdates', {
    offset,
    timeout: 0,
    allowed_updates: ['message'],
  });
  if (!data.ok) return;
  for (const update of data.result || []) {
    offset = update.update_id + 1;
    const msg = update.message;
    if (!msg?.chat || !(msg.text || '').trim().startsWith('/start')) continue;
    const code = await ensureInvite(env, msg.chat.id, msg.from || {});
    const link = `${publicBase(env)}?i=${encodeURIComponent(code)}`;
    const reply = [
      'سلام 💕 لینک اختصاصی دعوت‌نامه‌ات آماده‌ست.',
      '',
      'این لینک رو برای کسی که دوست داری بفرست.',
      'وقتی جواب «آره» بده و فرم رو تموم کنه، همینجا برات می‌فرستم.',
      '',
      link,
    ].join('\n');
    await tg(env, 'sendMessage', {
      chat_id: msg.chat.id,
      text: reply,
      disable_web_page_preview: true,
    });
  }
  await env.INVITES.put('meta:update_offset', String(offset));
}
