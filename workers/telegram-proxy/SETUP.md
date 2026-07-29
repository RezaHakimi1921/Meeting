# رفع مشکل Start ربات — چک‌لیست Cloudflare

کد جدید: `workers/telegram-proxy/src/index.js` (دوباره Paste + Deploy)

## ۱) Secret توکن
Workers → nameless-feather-4353 → Settings → Variables and Secrets  
→ Add → **Secret**  
- Name: `TELEGRAM_BOT_TOKEN`  
- Value: توکن BotFather

## ۲) Variables
Add variable:
- `PUBLIC_BASE_URL` = `http://94.182.92.79/meeting`
- `BOT_USERNAME` = `Meetingir_mir_bot`

## ۳) KV Binding (از اسکرین‌شات مشخصه الان 0 Bindings داری — همین علت اصلیه)
Settings → Bindings → Add → **KV Namespace**
- Variable name: `INVITES`  (دقیقاً همین)
- Namespace: Create new → مثلاً `meeting-invites`

Deploy دوباره بعد از Binding.

## ۴) ثبت Webhook تلگرام
بعد از Deploy، از همین PC:

```
POST https://nameless-feather-4353.rezahakimi1921.workers.dev/register-webhook
```

یا مستقیم:
```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://nameless-feather-4353.rezahakimi1921.workers.dev/telegram-webhook
```

## ۵) تست
1. باز کردن: `https://nameless-feather-4353.rezahakimi1921.workers.dev/health`  
   باید `"hasToken":true,"hasKv":true` باشد
2. در ربات `/start` → باید لینک شخصی بیاید
