# Cloudflare Worker bridge for Telegram + personal invites

Worker URL (current):
https://nameless-feather-4353.rezahakimi1921.workers.dev

## Dashboard setup (required once)

1. Workers → your worker → Settings → Variables
   - Secret: `TELEGRAM_BOT_TOKEN` = bot token
   - Var: `PUBLIC_BASE_URL` = `http://94.182.92.79/meeting`
   - Var: `BOT_USERNAME` = `Meetingir_mir_bot`

2. Create KV namespace named `INVITES` and bind it as `INVITES`

3. Triggers → Cron → `* * * * *` (every minute) for `/start` polling

4. Paste/deploy code from `src/index.js`

## Endpoints

- `GET  /health`
- `GET  /invite/:id`
- `POST /notify`  body: `{ inviteId, date, time, order }`
- `GET|POST /bot...` transparent proxy to Telegram

## Note

The Ubuntu server cannot reliably reach workers.dev / Telegram.
The web app must call this Worker directly from the browser.
