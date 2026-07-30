/**
 * Telegram bridge for Date Invite (Cloudflare Worker + D1)
 *
 * Dashboard bindings / vars:
 *   Secret: TELEGRAM_BOT_TOKEN
 *   Vars:   PUBLIC_BASE_URL = https://bold-frog-8303.zerodeploy.app
 *           ORIGIN_HINT = http://94.182.92.79
 *           BOT_USERNAME = Meetingir_mir_bot
 *   D1:     binding name must be exactly DB
 *
 * Clear PUBLIC_BASE_URL if it still points at a raw IP.
 * Run schema.sql once in D1 Console (or POST /init-db).
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith('/bot')) {
        return proxyTelegram(request, url);
      }

      if (request.method === 'OPTIONS') {
        return cors(new Response(null, { status: 204 }));
      }

      if (request.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
        return cors(
          json({
            ok: true,
            service: 'meeting-telegram-bridge',
            hasToken: Boolean(token(env)),
            hasDb: Boolean(env.DB),
            publicBase: await resolvePublicBase(env),
          })
        );
      }

      // /r/CODE → clean public meeting page
      const redirectMatch = url.pathname.match(/^\/r\/([a-zA-Z0-9_-]+)$/);
      if (request.method === 'GET' && redirectMatch) {
        const code = redirectMatch[1];
        const base = await resolvePublicBase(env);
        return Response.redirect(`${base}?i=${encodeURIComponent(code)}`, 302);
      }

      if (request.method === 'GET' && (url.pathname === '/meeting' || url.pathname.startsWith('/meeting/'))) {
        return proxyMeeting(request, env, url);
      }

      if (request.method === 'POST' && url.pathname === '/telegram-webhook') {
        const update = await request.json();
        try {
          await ensureDb(env);
          await handleBotUpdate(env, update);
        } catch (e) {
          const chatId =
            update?.message?.chat?.id ||
            update?.edited_message?.chat?.id ||
            update?.callback_query?.message?.chat?.id;
          if (chatId) {
            try {
              await tg(env, 'sendMessage', {
                chat_id: chatId,
                text: `متأسفم، ربات خطا داد 😕\n${String(e.message || e).slice(0, 200)}`,
              });
            } catch {
              // ignore
            }
          }
        }
        // Always ACK Telegram so delivery keeps working
        return new Response('ok');
      }

      if (request.method === 'POST' && url.pathname === '/register-webhook') {
        return cors(await registerWebhook(env, url.origin));
      }

      // Apply D1 schema (safe to call more than once)
      if (request.method === 'POST' && url.pathname === '/init-db') {
        return cors(await initDb(env));
      }

      const inviteMatch = url.pathname.match(/^\/invite\/([a-zA-Z0-9_-]+)$/);
      if (request.method === 'GET' && inviteMatch) {
        return cors(await getInvite(env, inviteMatch[1]));
      }

      if (request.method === 'POST' && url.pathname === '/notify') {
        return cors(await handleNotify(request, env));
      }

      return cors(new Response('Not found', { status: 404 }));
    } catch (e) {
      return cors(json({ ok: false, error: e.message || 'worker_error' }, 500));
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(pollUpdates(env));
  },
};

async function proxyTelegram(request, url) {
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

/**
 * Serve meeting static files.
 * Cloudflare Workers CANNOT fetch() a raw IP (returns error 1003).
 * If ORIGIN_HINT is an IP, redirect the browser instead of proxying.
 */
async function proxyMeeting(request, env, url) {
  const origin = originHint(env);
  const dest = `${origin}${url.pathname}${url.search}`;

  // Raw IPv4/IPv6 in URL → redirect browser (fetch would 1003)
  if (/^https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\//i.test(origin + '/') ||
      /^https?:\/\/\[/i.test(origin)) {
    return Response.redirect(dest, 302);
  }

  const res = await fetch(dest, {
    method: 'GET',
    headers: { 'User-Agent': request.headers.get('User-Agent') || 'meeting-bridge' },
    redirect: 'follow',
  });
  const headers = new Headers(res.headers);
  headers.delete('content-encoding');
  headers.delete('transfer-encoding');
  headers.delete('content-security-policy');
  headers.set('Cache-Control', res.headers.get('Cache-Control') || 'public, max-age=60');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
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

function originHint(env) {
  return (env.ORIGIN_HINT || 'http://94.182.92.79').replace(/\/$/, '');
}

function workerPublic(env) {
  return (env.WORKER_PUBLIC_URL || 'https://nameless-feather-4353.rezahakimi1921.workers.dev').replace(
    /\/$/,
    ''
  );
}

function isDirtyPublicUrl(url) {
  const u = String(url || '').toLowerCase();
  if (!u) return true;
  if (u.includes('94.182.92.79')) return true;
  if (u.includes('workers.dev')) return true;
  if (u.includes('rezahakimi')) return true;
  return false;
}

function isCleanPublicUrl(url) {
  const u = String(url || '').trim();
  if (!/^https?:\/\//i.test(u)) return false;
  return !isDirtyPublicUrl(u);
}

function configuredPublicBase(env) {
  return (
    env.PUBLIC_BASE_URL ||
    // Neutral host (no server IP, no personal workers.dev name)
    'https://bold-frog-8303.zerodeploy.app'
  ).replace(/\/$/, '');
}

function requireDb(env) {
  if (!env.DB) {
    throw new Error('D1 binding DB is missing. Add it in Worker Settings → Bindings.');
  }
}

async function initDb(env) {
  requireDb(env);
  await env.DB.batch([
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS invites (
        code TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        alias TEXT NOT NULL DEFAULT '',
        username TEXT NOT NULL DEFAULT '',
        first_name TEXT NOT NULL DEFAULT '',
        completed INTEGER NOT NULL DEFAULT 0,
        burned INTEGER NOT NULL DEFAULT 0,
        short_url TEXT,
        open_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT
      )
    `),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_invites_chat ON invites(chat_id)`
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_invites_chat_open ON invites(chat_id, completed, burned)`
    ),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS chat_state (
        chat_id TEXT PRIMARY KEY,
        pending TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `),
  ]);
  return json({ ok: true, initialized: true });
}

/** Ensure schema exists (idempotent). */
async function ensureDb(env) {
  requireDb(env);
  try {
    const ready = await env.DB.prepare('SELECT value FROM meta WHERE key = ?')
      .bind('schema_v1')
      .first();
    if (ready?.value === '1') return;
  } catch {
    // tables missing — create below
  }
  await initDb(env);
  await env.DB.prepare(
    `INSERT INTO meta (key, value) VALUES ('schema_v1', '1')
     ON CONFLICT(key) DO UPDATE SET value = '1'`
  ).run();
}

async function metaGet(env, key) {
  requireDb(env);
  const row = await env.DB.prepare('SELECT value FROM meta WHERE key = ?').bind(key).first();
  return row?.value || null;
}

async function metaPut(env, key, value) {
  requireDb(env);
  await env.DB.prepare(
    `INSERT INTO meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  )
    .bind(key, String(value))
    .run();
}

async function resolvePublicBase(env) {
  const configured = configuredPublicBase(env);
  // Ignore dirty PUBLIC_BASE_URL (raw IP / personal workers.dev) for share links
  if (isCleanPublicUrl(configured)) return configured;

  try {
    const cached = await metaGet(env, 'public_base');
    if (isCleanPublicUrl(cached)) return String(cached).replace(/\/$/, '');
  } catch {
    // DB may not be ready yet
  }

  try {
    const res = await fetch(`${originHint(env)}/meeting/public-base.txt`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    // fetch to raw IP is blocked by CF — may throw/1003; ignore
    if (res.ok) {
      let text = (await res.text()).trim().replace(/\/$/, '');
      if (text && text.includes('94.182.92.79') && !text.endsWith('/meeting')) {
        text = `${text}/meeting`;
      }
      if (isCleanPublicUrl(text)) {
        try {
          await metaPut(env, 'public_base', text);
        } catch {
          // ignore
        }
        return text;
      }
    }
  } catch {
    // ignore (often CF 1003 when ORIGIN_HINT is an IP)
  }

  // Fallback: neutral static host (not IP / not personal workers.dev)
  return 'https://bold-frog-8303.zerodeploy.app';
}

function inviteOpenLink(base, code) {
  return `${base}?i=${encodeURIComponent(code)}`;
}

function inviteBridgePath(env, code) {
  return `${workerPublic(env)}/r/${encodeURIComponent(code)}`;
}

async function getInviteRow(env, code) {
  requireDb(env);
  return env.DB.prepare('SELECT * FROM invites WHERE code = ?').bind(String(code)).first();
}

async function resolveShareLink(env, code) {
  requireDb(env);
  const record = await getInviteRow(env, code);
  if (
    record?.short_url &&
    record.open_url &&
    !isDirtyPublicUrl(record.short_url) &&
    !isDirtyPublicUrl(record.open_url)
  ) {
    return record.short_url;
  }

  // Prefer a clean public base; never put workers.dev / IP / personal name in Telegram text.
  const base = await resolvePublicBase(env);
  let target = inviteOpenLink(base, code);
  if (isDirtyPublicUrl(target)) {
    // Browser-openable origin page (may be IP). Will be wrapped by shortener below.
    target = `${originHint(env)}/meeting?i=${encodeURIComponent(code)}`;
  }

  let shortUrl = null;
  for (const api of [
    `https://is.gd/create.php?format=json&url=${encodeURIComponent(target)}`,
    `https://v.gd/create.php?format=json&url=${encodeURIComponent(target)}`,
  ]) {
    try {
      const res = await fetch(api, { method: 'GET' });
      const data = await res.json();
      if (data && data.shorturl && !isDirtyPublicUrl(data.shorturl)) {
        shortUrl = data.shorturl;
        break;
      }
    } catch {
      // try next
    }
  }

  // Last resort: never send workers.dev with personal account name
  if (!shortUrl) {
    shortUrl = isDirtyPublicUrl(target) ? target : target;
  }

  if (record) {
    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE invites SET short_url = ?, open_url = ?, updated_at = ? WHERE code = ?`
    )
      .bind(shortUrl, target, now, String(code))
      .run();
  }
  return shortUrl;
}

async function tg(env, method, body) {
  const t = token(env);
  if (!t) throw new Error('TELEGRAM_BOT_TOKEN secret is missing');
  const res = await fetch(`https://api.telegram.org/bot${t}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  return res.json();
}

async function registerWebhook(env, origin) {
  try {
    const hook = `${origin}/telegram-webhook`;
    const result = await tg(env, 'setWebhook', {
      url: hook,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    });
    return json({ ok: Boolean(result.ok), hook, result });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}

function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getChatState(env, chatId) {
  requireDb(env);
  return env.DB.prepare('SELECT * FROM chat_state WHERE chat_id = ?')
    .bind(String(chatId))
    .first();
}

async function setChatPending(env, chatId, pending) {
  requireDb(env);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO chat_state (chat_id, pending, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(chat_id) DO UPDATE SET pending = excluded.pending, updated_at = excluded.updated_at`
  )
    .bind(String(chatId), pending || '', now)
    .run();
}

async function clearChatPending(env, chatId) {
  await setChatPending(env, chatId, '');
}

async function burnOpenInvites(env, chatId) {
  requireDb(env);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE invites
     SET burned = 1, completed = 1, completed_at = ?, updated_at = ?
     WHERE chat_id = ? AND completed = 0 AND burned = 0`
  )
    .bind(now, now, String(chatId))
    .run();
}

async function getActiveInvite(env, chatId) {
  requireDb(env);
  return env.DB.prepare(
    `SELECT * FROM invites
     WHERE chat_id = ? AND completed = 0 AND burned = 0
     ORDER BY created_at DESC
     LIMIT 1`
  )
    .bind(String(chatId))
    .first();
}

async function createInvite(env, chatId, from = {}, alias = '') {
  requireDb(env);
  const chatKey = String(chatId);
  let code = makeCode();
  while (await getInviteRow(env, code)) code = makeCode();

  const now = new Date().toISOString();
  // Keep previous links open — do not burn them

  await env.DB.prepare(
    `INSERT INTO invites (
      code, chat_id, alias, username, first_name, completed, burned,
      short_url, open_url, created_at, updated_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, 0, 0, NULL, NULL, ?, ?, NULL)`
  )
    .bind(
      code,
      chatKey,
      String(alias || '').trim().slice(0, 64),
      from.username || '',
      from.first_name || '',
      now,
      now
    )
    .run();

  return code;
}

async function askForAlias(env, chatId) {
  await setChatPending(env, chatId, 'await_alias');
  const result = await tg(env, 'sendMessage', {
    chat_id: chatId,
    text: [
      'سلام 💕',
      '',
      'این لینک برای کیه؟',
      'یک اسم/Alias بفرست (مثلاً: سارا)',
      '',
      'این اسم فقط برای خودت ذخیره می‌شه؛ طرف مقابل نمی‌بینه.',
    ].join('\n'),
  });
  if (!result?.ok) {
    throw new Error(result?.description || 'telegram_send_failed');
  }
}

async function listOpenInvites(env, chatId) {
  requireDb(env);
  const res = await env.DB.prepare(
    `SELECT * FROM invites
     WHERE chat_id = ? AND completed = 0
     ORDER BY created_at DESC
     LIMIT 20`
  )
    .bind(String(chatId))
    .all();
  return res?.results || [];
}

async function sendLinkMessage(env, chatId, code) {
  const row = await getInviteRow(env, code);
  const link = await resolveShareLink(env, code);
  const alias = (row?.alias || '').trim() || '—';
  const text = [
    'سلام 💕 لینک جدیدت آماده‌ست.',
    '',
    `🏷 برای: ${alias}`,
    '',
    'این لینک رو برای کسی که دوست داری بفرست.',
    'وقتی جواب «آره» بده و فرم رو تموم کنه، همینجا برات می‌فرستم.',
    '',
    link,
  ].join('\n');

  await tg(env, 'sendMessage', {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [[{ text: 'لینک جدید ✨', callback_data: 'link:new' }]],
    },
  });
}

async function showActiveOrAsk(env, chatId) {
  const open = await listOpenInvites(env, chatId);
  if (!open.length) {
    await askForAlias(env, chatId);
    return;
  }

  const lines = ['سلام 💕', '', 'لینک‌های بازت:'];
  for (const row of open) {
    const link = await resolveShareLink(env, row.code);
    const alias = (row.alias || '').trim() || '—';
    lines.push('', `🏷 برای: ${alias}`, link);
  }
  lines.push('', 'اگر لینک جدید می‌خوای، دکمه پایین رو بزن.');

  await tg(env, 'sendMessage', {
    chat_id: chatId,
    text: lines.join('\n'),
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [[{ text: 'لینک جدید ✨', callback_data: 'link:new' }]],
    },
  });
}

async function handleBotUpdate(env, update) {
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat?.id;
    const data = cq.data || '';
    if (!chatId) return;

    try {
      await tg(env, 'answerCallbackQuery', { callback_query_id: cq.id });
    } catch {
      // ignore
    }

    if (cq.message?.message_id) {
      try {
        await tg(env, 'editMessageReplyMarkup', {
          chat_id: chatId,
          message_id: cq.message.message_id,
          reply_markup: { inline_keyboard: [] },
        });
      } catch {
        // ignore
      }
    }

    if (data === 'link:new') {
      await askForAlias(env, chatId);
    }
    return;
  }

  const msg = update.message || update.edited_message;
  if (!msg?.chat) return;
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  if (!text) return;

  // Alias reply
  const state = await getChatState(env, chatId);
  if (state?.pending === 'await_alias' && !text.startsWith('/')) {
    const alias = text.slice(0, 64);
    await clearChatPending(env, chatId);
    const code = await createInvite(env, chatId, msg.from || {}, alias);
    await sendLinkMessage(env, chatId, code);
    return;
  }

  if (text.startsWith('/start') || text === '/new' || text === 'لینک جدید') {
    // Always reset alias prompt state on /start so the bot never looks "stuck"
    await clearChatPending(env, chatId);
    await showActiveOrAsk(env, chatId);
  }
}

async function getInvite(env, code) {
  try {
    requireDb(env);
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
  const record = await getInviteRow(env, code);
  if (!record) return json({ ok: false, error: 'invite_not_found' }, 404);
  // All minted codes stay openable (even if previously marked burned)
  return json({
    ok: true,
    inviteId: code,
    ownerName: record.first_name || record.username || '',
    // alias intentionally omitted — owner-only
  });
}

async function handleNotify(request, env) {
  try {
    requireDb(env);
    const body = await request.json();
    const inviteId = body.inviteId || body.i;
    if (!inviteId) return json({ ok: false, error: 'inviteId_required' }, 400);
    const record = await getInviteRow(env, String(inviteId));
    if (!record) return json({ ok: false, error: 'invite_not_found' }, 404);
    if (record.burned) {
      // revive previously burned codes so older shared links still open
      await env.DB.prepare(`UPDATE invites SET burned = 0, updated_at = ? WHERE code = ?`)
        .bind(new Date().toISOString(), String(inviteId))
        .run();
    }

    const dateLabel = body?.date?.label || '—';
    const weekday = body?.date?.weekdayFa || '';
    const time = body?.time?.label || '—';
    const order = body?.order?.label || '—';
    const emoji = body?.order?.emoji || '💕';
    const code = String(inviteId);
    const link = await resolveShareLink(env, code);
    const alias = (record.alias || '').trim() || '—';
    const text = [
      'خبر خوب! جواب مثبت ثبت شد 🎉',
      '',
      `🏷 برای: ${alias}`,
      `🔗 لینک:`,
      link,
      `کد دعوت: ${code}`,
      '',
      `📅 ${weekday} ${dateLabel}`.trim(),
      `⏰ ساعت ${time}`,
      `${emoji} سفارش: ${order}`,
    ].join('\n');

    const result = await tg(env, 'sendMessage', {
      chat_id: record.chat_id,
      text,
      disable_web_page_preview: true,
    });
    if (!result.ok) return json({ ok: false, error: result.description || 'telegram_error' }, 502);

    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE invites SET completed = 1, completed_at = ?, updated_at = ? WHERE code = ?`
    )
      .bind(now, now, code)
      .run();

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: e.message || 'error' }, 500);
  }
}

async function pollUpdates(env) {
  if (!token(env) || !env.DB) return;
  let offset = 0;
  try {
    offset = Number((await metaGet(env, 'update_offset')) || 0);
  } catch {
    return;
  }
  const data = await tg(env, 'getUpdates', {
    offset,
    timeout: 0,
    allowed_updates: ['message', 'callback_query'],
  });
  if (!data.ok) return;
  for (const update of data.result || []) {
    offset = update.update_id + 1;
    await handleBotUpdate(env, update);
  }
  await metaPut(env, 'update_offset', String(offset));
}
