# Design: Invite Alias + Cloudflare D1

Date: 2026-07-29

## Goal
- Each invite has an owner-only **Alias** (e.g. person's name).
- Alias is never shown on the public web invite page.
- Creating a **new** link burns all previous open links for that owner.
- Storage moves from KV → **Cloudflare D1** for scale.

## Bot flow
1. `/start` or button «لینک جدید» → ask for Alias text.
2. Owner replies with Alias → burn open invites for chat → create invite → send clean share URL + Alias (owner only).
3. On accept notify → Telegram message includes Alias + link code + date/time/order.

## D1 schema
See `workers/telegram-proxy/schema.sql`.

## Bindings
- `DB` → D1 database
- Keep `TELEGRAM_BOT_TOKEN`, `PUBLIC_BASE_URL` vars
