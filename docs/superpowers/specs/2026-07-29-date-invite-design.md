# Date Invite — Design Spec

**Date:** 2026-07-29  
**Status:** Approved  
**Product name:** Date Invite  
**Goal:** A romantic, interactive invite opened via a simple shareable link (`/meeting`) on an Ubuntu Nginx host.

---

## 1. Summary

Build a four-step story-style invite as an **Expo (JavaScript) Web** app, exported as static files and served by Nginx at **`/meeting`**. Flow is linear (`useState` only — no React Navigation). Choices persist in AsyncStorage so a completed invite reopens on the final screen.

**Public URL (initial):** `https://94-182-92-79.sslip.io/meeting`

---

## 2. Platform & Stack

| Layer | Choice |
|--------|--------|
| App | Expo + React Native (JS), web-first |
| Export | `npx expo export -p web` → static `dist/` |
| Host | Ubuntu, Nginx static files |
| Path | `/meeting` |
| SSL | Certbot + sslip.io hostname |
| Calendar | Jalali via `dayjs` + jalali plugin (or `jalaali-js`) |
| Animation | React Native `Animated` (+ CSS/web-friendly transforms). **Not** `react-native-reanimated` |
| Storage | `@react-native-async-storage/async-storage` |
| Share | `expo-sharing` / Web Share API / clipboard fallback |
| RTL | Persian copy; `textAlign: 'right'`, `writingDirection: 'rtl'`; `I18nManager` where useful |

---

## 3. Architecture

```
App.js                    // step state, persistence, transitions
├── theme.js              // colors, radii, spacing
├── storage.js            // AsyncStorage load/save/clear
├── utils/jalali.js       // month grid + weekday labels (FA)
├── components/
│   ├── BackgroundHearts.js
│   ├── ProgressBar.js
│   ├── IntroCard.js
│   ├── DatePickerCard.js
│   ├── OrderPickerCard.js
│   └── FinalCard.js
```

Parent owns:

- `step` ∈ `{1,2,3,4}`
- `selectedDate` — `{ jy, jm, jd, weekdayFa, label }` or `null`
- `selectedOrder` — `{ id, emoji, label }` or `null`
- `completed` — boolean

On mount: if stored `completed === true`, set `step = 4` and hydrate selections.

---

## 4. Steps & Copy

### Step 1 — IntroCard

- Large emoji: 🥺  
- Title: «با من میای سر قرار؟»  
- Subtitle: «فقط یه سوال ساده‌ست... جواب درست هم فقط یکیشه 😏»  
- Buttons: «نه» (small, gray, flees on press/hover) · «آره 💕» (large pink pill, soft pulse)  
- Hint: «آره همینجاست، منتظرته 💌»  
- «آره» → step 2  

### Step 2 — DatePickerCard

- Jalali monthly calendar grid; selected day highlighted pink  
- Past days disabled (or non-selectable) relative to “today” in Jalali  
- CTA «بعدی» disabled until a day is selected  
- Optional micro-affirmation (short, dismisses into next step): «عالی… همون روز رو تو تقویم قلبم زدم 💗»  
- → step 3  

### Step 3 — OrderPickerCard

- Title: «چی سفارش میدی؟»  
- Subtitle: «یه چیز خوشمزه انتخاب کن که مهمونت باشی»  
- 2×2 options: 🍕 پیتزا · ☕ قهوه · 🍢 کوبیده · 🍒 دسر  
- Selected card: pink border  
- CTA: «بریم که بریم 💌» (disabled until selection)  
- On confirm: set `completed = true`, persist, → step 4  

### Step 4 — FinalCard

- 🎉 + light confetti  
- Dynamic message:  
  «خوشحالم نگفتی نه! پس **[weekdayFa] [label]** ساعت **[HH:mm دستگاه هنگام ورود به مرحله ۴]**، دنبالت میام برای **[order.label]** 🚗»  
- Extra warm line: «منتظرتم با لبخند 🌸»  
- Footnote: «برای اینکه ازت درخواست کنم یه وبسایت طراحی کردم، چیز مهمی نبود 🎀»  
- Share button with romantic short summary + link to `/meeting`  
- Tiny hidden/reset control for the owner (testing only), not prominent  

---

## 5. Visual Design

| Token | Value |
|--------|--------|
| Background gradient | `#FDEFF7` → `#F6D9EC` |
| Primary button | `#E91E63` → `#F06292` |
| Text | `#3A2E33` |
| Cards | White, soft shadow, `borderRadius: 24` |
| Layout | Portrait-first, comfortable spacing, responsive |

Floating heart emojis in background (low opacity, slow float). Progress bar: four story-like segments above the card.

---

## 6. Interaction & Motion

- **Card change:** fade + slight vertical slide  
- **«نه»:** on press / hover (web), relocate randomly within safe bounds (stay on screen)  
- **«آره»:** gentle scale pulse loop  
- **Hearts:** continuous soft translate/opacity  
- **Confetti:** simple Animated particles on step 4 mount  

### Tap feedback (important)

Do **not** rely on haptic vibration.

- **Primary:** short visual micro-bounce (scale) on the tapped control — works on all devices  
- **Bonus only:** if `navigator.vibrate` exists (some Android browsers), a brief vibrate may fire; iOS Safari has no vibrate support  

---

## 7. Persistence

Storage key: `@dateInvite/selections`

Payload shape:

```json
{
  "selectedDate": { "jy": 1404, "jm": 5, "jd": 15, "weekdayFa": "چهارشنبه", "label": "۱۵ مرداد ۱۴۰۴" },
  "selectedOrder": { "id": "pizza", "emoji": "🍕", "label": "پیتزا" },
  "completed": true,
  "completedAt": "2026-07-29T14:30:00.000Z",
  "finalClock": "14:30"
}
```

`finalClock` is captured once when entering step 4 the first time (so reopen stays consistent).

Reset control clears storage and returns to step 1.

---

## 8. Attractiveness polish (in scope)

1. Warm, conversational Persian microcopy (not form-like)  
2. Visual micro-bounce on primary taps (plus optional vibrate)  
3. Short emotional affirmation after date pick  
4. Extra affectionate line on final card  
5. Share text tuned for chat/stories  
6. Soft motion hierarchy (pulse, float, confetti) without clutter  

Out of scope for v1: personalization by name, backend, accounts, push notifications.

---

## 9. Deployment

1. Build: `npx expo export -p web`  
2. Upload `dist/` → `/var/www/date-invite` on `94.182.92.79`  
3. Nginx `server_name` via sslip.io: `94-182-92-79.sslip.io`  
4. Serve app under **`location /meeting/`** (alias/root to static files; SPA `try_files` → `index.html`)  
5. Ensure Expo `baseUrl` / asset prefix matches `/meeting` so JS/CSS resolve correctly  
6. Open firewall ports **80** and **443** if closed  
7. Certbot HTTPS for the sslip.io host  

**Security:** SSH credentials must never be committed. Rotate password after deploy (shared in chat).

---

## 10. Testing (acceptance)

- [ ] All four steps work on mobile Chrome (Android) and Safari (iOS) portrait  
- [ ] RTL Persian text reads correctly  
- [ ] Jalali calendar shows correct month/weekday; selection required for Next  
- [ ] Fleeing «نه» stays on screen; «آره» advances  
- [ ] Completed session reopens on FinalCard with same date/order/clock  
- [ ] Share works or clipboard fallback succeeds  
- [ ] `https://94-182-92-79.sslip.io/meeting` loads over HTTPS  
- [ ] Assets load under `/meeting` (no broken JS/CSS paths)  

---

## 11. Non-goals

- Native store builds as primary delivery  
- React Navigation  
- `react-native-reanimated`  
- Server-side storage / multi-user invites  
- Purchased custom domain (optional later; path `/meeting` stays)
