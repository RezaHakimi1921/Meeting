# Cloudflare Worker — Telegram API reverse proxy

Deploy:
```bash
cd workers/telegram-proxy
npm install
npx wrangler login   # or set CLOUDFLARE_API_TOKEN
npx wrangler deploy
```

Then set on the Ubuntu notify service:
```
TELEGRAM_API_BASE=https://telegram-proxy.<your-subdomain>.workers.dev
```

Security: only `/bot*` paths are forwarded. Token is never stored in the Worker.
