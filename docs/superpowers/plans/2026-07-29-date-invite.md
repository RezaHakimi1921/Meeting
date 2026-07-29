# Date Invite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a romantic four-step Jalali date-invite Expo Web app at `https://94-182-92-79.sslip.io/meeting`.

**Architecture:** Single Expo JS app; parent `App.js` owns step/selection state and AsyncStorage; four card components + progress + floating hearts; static export served by Nginx under `/meeting`.

**Tech Stack:** Expo (JS), React Native Web, `Animated`, AsyncStorage, dayjs + jalali plugin (or jalaali-js), Nginx, Certbot, sslip.io.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-29-date-invite-design.md`
- Language: JavaScript (not TypeScript)
- Navigation: `useState` steps only — no React Navigation
- Animation: RN `Animated` only — no `react-native-reanimated`
- Calendar: Jalali; Persian RTL copy
- Public path: `/meeting` (Expo asset base must match)
- Colors: bg `#FDEFF7`→`#F6D9EC`, primary `#E91E63`→`#F06292`, text `#3A2E33`, cards white radius 24
- Tap feedback: micro-bounce primary; `navigator.vibrate` optional bonus only
- Never commit SSH passwords or server secrets
- Server: `94.182.92.79`, deploy root `/var/www/date-invite`, URL path `/meeting`

---

## File Structure

```
package.json
app.json
babel.config.js
App.js
index.js
theme.js
storage.js
utils/jalali.js
utils/jalali.test.js
utils/tapFeedback.js
components/BackgroundHearts.js
components/ProgressBar.js
components/IntroCard.js
components/DatePickerCard.js
components/OrderPickerCard.js
components/FinalCard.js
deploy/nginx-date-invite.conf
```

---

### Task 1: Scaffold Expo app + theme + base path

**Files:**
- Create: `package.json`, `app.json`, `babel.config.js`, `index.js`, `App.js`, `theme.js`
- Test: manual `npx expo start --web` smoke (after install)

**Interfaces:**
- Produces: `theme` export with `colors`, `radii`, `spacing`; Expo web `baseUrl` `/meeting`

- [ ] **Step 1: Create Expo app in workspace root**

Run from `D:\مخ زنی`:

```bash
npx create-expo-app@latest . --template blank
```

If directory not empty (docs exist), create in temp and move app files into root, keeping `docs/`.

Expected: `package.json`, `App.js`, `app.json` present.

- [ ] **Step 2: Configure `app.json` for web base `/meeting`**

Set in `app.json`:

```json
{
  "expo": {
    "name": "Date Invite",
    "slug": "date-invite",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "experiments": {
      "baseUrl": "/meeting"
    },
    "plugins": []
  }
}
```

- [ ] **Step 3: Add `theme.js`**

```js
export const colors = {
  bgStart: '#FDEFF7',
  bgEnd: '#F6D9EC',
  primary: '#E91E63',
  primarySoft: '#F06292',
  text: '#3A2E33',
  muted: '#8A7A80',
  card: '#FFFFFF',
  noButton: '#B0A8AC',
};

export const radii = { card: 24, pill: 999 };

export const spacing = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 };
```

- [ ] **Step 4: Minimal `App.js` shell**

```js
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from './theme';

export default function App() {
  return (
    <LinearGradient colors={[colors.bgStart, colors.bgEnd]} style={styles.root}>
      <Text style={styles.probe}>Date Invite</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  probe: { color: colors.text, fontSize: 22, textAlign: 'right', writingDirection: 'rtl' },
});
```

Install: `npx expo install expo-linear-gradient @react-native-async-storage/async-storage`

- [ ] **Step 5: Commit**

```bash
git add package.json app.json babel.config.js index.js App.js theme.js package-lock.json assets
git commit -m "chore: scaffold Expo Date Invite with theme and /meeting base"
```

---

### Task 2: Jalali helpers + unit tests

**Files:**
- Create: `utils/jalali.js`, `utils/jalali.test.js`
- Modify: `package.json` (devDeps: `jest`, `jalaali-js` or `dayjs` + plugin)

**Interfaces:**
- Produces:
  - `toFaDigits(str: string): string`
  - `getMonthGrid(jy: number, jm: number): Array<{ jy, jm, jd, inMonth: boolean, weekday: number }>`
  - `formatDateLabel(jy, jm, jd): { weekdayFa: string, label: string }`
  - `todayJalali(): { jy, jm, jd }`
  - `isBeforeToday(jy, jm, jd): boolean`
  - `WEEKDAYS_FA: string[]` (شنبه … جمعه)
  - `MONTHS_FA: string[]`

- [ ] **Step 1: Install calendar + jest**

```bash
npm install jalaali-js
npm install -D jest
```

Add to `package.json`:

```json
"scripts": {
  "test": "jest"
},
"jest": {
  "testEnvironment": "node",
  "testMatch": ["**/*.test.js"]
}
```

- [ ] **Step 2: Write failing tests in `utils/jalali.test.js`**

```js
const {
  toFaDigits,
  formatDateLabel,
  getMonthGrid,
  WEEKDAYS_FA,
  MONTHS_FA,
} = require('./jalali');

test('toFaDigits converts western digits', () => {
  expect(toFaDigits('15')).toBe('۱۵');
});

test('MONTHS_FA has 12 months', () => {
  expect(MONTHS_FA).toHaveLength(12);
  expect(MONTHS_FA[4]).toBe('مرداد');
});

test('WEEKDAYS_FA starts with شنبه', () => {
  expect(WEEKDAYS_FA[0]).toBe('شنبه');
});

test('formatDateLabel returns Persian weekday and label', () => {
  const r = formatDateLabel(1404, 5, 15);
  expect(r.label).toContain('مرداد');
  expect(r.label).toContain('۱۴۰۴');
  expect(WEEKDAYS_FA).toContain(r.weekdayFa);
});

test('getMonthGrid returns weeks covering the month', () => {
  const grid = getMonthGrid(1404, 5);
  expect(grid.length % 7).toBe(0);
  expect(grid.some((c) => c.inMonth && c.jd === 1)).toBe(true);
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
npm test
```

Expected: FAIL (module missing or functions undefined).

- [ ] **Step 4: Implement `utils/jalali.js`**

```js
const jalaali = require('jalaali-js');

const WEEKDAYS_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const MONTHS_FA = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

function toFaDigits(input) {
  return String(input).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

function todayJalali() {
  const n = new Date();
  return jalaali.toJalaali(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

function isBeforeToday(jy, jm, jd) {
  const t = todayJalali();
  if (jy !== t.jy) return jy < t.jy;
  if (jm !== t.jm) return jm < t.jm;
  return jd < t.jd;
}

/** JS getDay(): 0=Sun … 6=Sat → index in WEEKDAYS_FA (شنبه=0) */
function gregorianWeekdayToFaIndex(date) {
  // Sat=0 … Fri=6
  return (date.getDay() + 1) % 7;
}

function formatDateLabel(jy, jm, jd) {
  const g = jalaali.toGregorian(jy, jm, jd);
  const date = new Date(g.gy, g.gm - 1, g.gd);
  const weekdayFa = WEEKDAYS_FA[gregorianWeekdayToFaIndex(date)];
  const label = `${toFaDigits(jd)} ${MONTHS_FA[jm - 1]} ${toFaDigits(jy)}`;
  return { weekdayFa, label };
}

function getMonthGrid(jy, jm) {
  const daysInMonth = jalaali.jalaaliMonthLength(jy, jm);
  const firstG = jalaali.toGregorian(jy, jm, 1);
  const firstDate = new Date(firstG.gy, firstG.gm - 1, firstG.gd);
  const startPad = gregorianWeekdayToFaIndex(firstDate);
  const cells = [];
  for (let i = 0; i < startPad; i++) {
    cells.push({ jy, jm, jd: null, inMonth: false, weekday: i });
  }
  for (let jd = 1; jd <= daysInMonth; jd++) {
    const g = jalaali.toGregorian(jy, jm, jd);
    const d = new Date(g.gy, g.gm - 1, g.gd);
    cells.push({
      jy,
      jm,
      jd,
      inMonth: true,
      weekday: gregorianWeekdayToFaIndex(d),
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ jy, jm, jd: null, inMonth: false, weekday: cells.length % 7 });
  }
  return cells;
}

module.exports = {
  WEEKDAYS_FA,
  MONTHS_FA,
  toFaDigits,
  todayJalali,
  isBeforeToday,
  formatDateLabel,
  getMonthGrid,
};
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add utils/jalali.js utils/jalali.test.js package.json package-lock.json
git commit -m "feat: add Jalali calendar helpers with tests"
```

---

### Task 3: Storage helper + tap feedback util

**Files:**
- Create: `storage.js`, `utils/tapFeedback.js`
- Test: light manual / optional jest for storage key constant

**Interfaces:**
- Produces:
  - `STORAGE_KEY = '@dateInvite/selections'`
  - `loadInvite(): Promise<object|null>`
  - `saveInvite(data): Promise<void>`
  - `clearInvite(): Promise<void>`
  - `bounce(animatedValue, toValue?): void` — spring scale pulse
  - `tryVibrate(ms?: number): void` — no-op if unavailable

- [ ] **Step 1: Implement `storage.js`**

```js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY = '@dateInvite/selections';

export async function loadInvite() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveInvite(data) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function clearInvite() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 2: Implement `utils/tapFeedback.js`**

```js
import { Animated, Platform } from 'react-native';

export function bounce(scaleAnim) {
  Animated.sequence([
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, friction: 5 }),
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
  ]).start();
}

export function tryVibrate(ms = 12) {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add storage.js utils/tapFeedback.js
git commit -m "feat: add invite persistence and tap feedback helpers"
```

---

### Task 4: ProgressBar + BackgroundHearts

**Files:**
- Create: `components/ProgressBar.js`, `components/BackgroundHearts.js`

**Interfaces:**
- Consumes: `theme`
- Produces:
  - `<ProgressBar step={1|2|3|4} total={4} />`
  - `<BackgroundHearts />`

- [ ] **Step 1: Implement `ProgressBar.js`**

Four horizontal segments; active/completed use `colors.primary`, upcoming muted pink. Full width of card, RTL-friendly (fill from right visually or mirror with `flexDirection: 'row-reverse'`).

- [ ] **Step 2: Implement `BackgroundHearts.js`**

6–8 absolute-positioned 💕/💗 with looping `Animated` translateY + opacity. `pointerEvents="none"`.

- [ ] **Step 3: Wire into `App.js` shell** to verify visually on web.

- [ ] **Step 4: Commit**

```bash
git add components/ProgressBar.js components/BackgroundHearts.js App.js
git commit -m "feat: add story progress bar and floating hearts"
```

---

### Task 5: IntroCard (fleeing No + pulsing Yes)

**Files:**
- Create: `components/IntroCard.js`
- Modify: `App.js`

**Interfaces:**
- Consumes: `bounce`, `tryVibrate`, `theme`
- Produces: `<IntroCard onYes={() => void} />`

- [ ] **Step 1: Implement IntroCard UI + copy** (exact Persian strings from spec)

- [ ] **Step 2: Fleeing «نه»**

Keep `noPos` state `{ top, left }` in % or px within card bounds; on `onPressIn` / web `onMouseEnter`, pick a new random position away from previous. Never leave parent bounds.

- [ ] **Step 3: Pulsing «آره»**

Loop `Animated.sequence` scale 1 → 1.05 → 1. On press: `bounce` + `tryVibrate` then `onYes()`.

- [ ] **Step 4: Manual check in browser** — No flees; Yes advances when wired.

- [ ] **Step 5: Commit**

```bash
git add components/IntroCard.js App.js
git commit -m "feat: add intro card with fleeing no and pulsing yes"
```

---

### Task 6: DatePickerCard (Jalali grid)

**Files:**
- Create: `components/DatePickerCard.js`
- Modify: `App.js`

**Interfaces:**
- Consumes: `getMonthGrid`, `formatDateLabel`, `todayJalali`, `isBeforeToday`, `MONTHS_FA`, `toFaDigits`, `bounce`
- Produces: `<DatePickerCard onNext={(selectedDate) => void} />`
- `selectedDate` shape: `{ jy, jm, jd, weekdayFa, label }`

- [ ] **Step 1: Month header** with prev/next month controls (do not allow navigating to months entirely before current month if it breaks UX; at minimum disable past days).

- [ ] **Step 2: 7-column grid** using `WEEKDAYS_FA` headers + `getMonthGrid`.

- [ ] **Step 3: Selection + disabled past days**; «بعدی» disabled until selection.

- [ ] **Step 4: On Next** — optional one-shot affirmation text «عالی… همون روز رو تو تقویم قلبم زدم 💗» (~900ms) then `onNext(selectedDate)`.

- [ ] **Step 5: Commit**

```bash
git add components/DatePickerCard.js App.js
git commit -m "feat: add Jalali date picker step"
```

---

### Task 7: OrderPickerCard

**Files:**
- Create: `components/OrderPickerCard.js`
- Modify: `App.js`

**Interfaces:**
- Produces: `<OrderPickerCard onConfirm={(order) => void} />`
- `order` shape: `{ id, emoji, label }`
- Options fixed: pizza/coffee/kebab/dessert with 🍕☕🍢🍒

- [ ] **Step 1: 2×2 selectable cards** with pink border when selected.

- [ ] **Step 2: CTA «بریم که بریم 💌»** disabled until selection; on press bounce + `onConfirm`.

- [ ] **Step 3: Commit**

```bash
git add components/OrderPickerCard.js App.js
git commit -m "feat: add order picker step"
```

---

### Task 8: FinalCard + Share + confetti

**Files:**
- Create: `components/FinalCard.js`
- Modify: `App.js`

**Interfaces:**
- Consumes: `selectedDate`, `selectedOrder`, `finalClock`, `onReset`
- Produces: Final message + Share

- [ ] **Step 1: Dynamic Persian message** per spec + line «منتظرتم با لبخند 🌸» + footnote.

- [ ] **Step 2: Simple confetti** — 12–20 absolutely positioned emoji/views with random Animated fall on mount.

- [ ] **Step 3: Share**

```js
const text = `دعوت به قرار 💕 ${selectedDate.weekdayFa} ${selectedDate.label} — ${selectedOrder.emoji} ${selectedOrder.label}\nمنتظرتم با لبخند 🌸\nhttps://94-182-92-79.sslip.io/meeting`;
```

Use `navigator.share` on web when available; else `navigator.clipboard.writeText` + alert «کپی شد 💌».

- [ ] **Step 4: Tiny reset control** (opacity low, small text «از اول») calling `onReset`.

- [ ] **Step 5: Commit**

```bash
git add components/FinalCard.js App.js
git commit -m "feat: add final invite card with share and confetti"
```

---

### Task 9: App orchestration + persistence + transitions

**Files:**
- Modify: `App.js`

**Interfaces:**
- Wires all cards; fade/slide between steps; hydrate from storage

- [ ] **Step 1: State + hydrate**

On mount `loadInvite()`; if `completed`, set step 4 and hydrate date/order/`finalClock`.

- [ ] **Step 2: Transitions**

Wrap active card in `Animated.View` opacity + translateY; bump animation when `step` changes.

- [ ] **Step 3: Handlers**

- `onYes` → step 2  
- `onDateNext` → save partial + step 3  
- `onOrderConfirm` → set `finalClock` from `new Date()` (`HH:mm` 24h local), `completed: true`, `saveInvite`, step 4  
- `onReset` → `clearInvite`, step 1, clear selections  

- [ ] **Step 4: Manual acceptance pass** against spec checklist (steps, RTL, persistence reopen).

- [ ] **Step 5: Commit**

```bash
git add App.js
git commit -m "feat: wire multi-step invite flow with persistence"
```

---

### Task 10: Web export + Nginx config + deploy

**Files:**
- Create: `deploy/nginx-date-invite.conf`
- Produce: `dist/` via export (gitignored)

**Interfaces:**
- Nginx serves `/meeting/` → `/var/www/date-invite/`
- HTTPS via Certbot on `94-182-92-79.sslip.io`

- [ ] **Step 1: Add `.gitignore` entries** for `dist/`, `.expo/`, `node_modules/` if missing.

- [ ] **Step 2: Export**

```bash
npx expo export -p web
```

Expected: `dist/index.html` and assets. Verify asset paths include `/meeting` prefix.

- [ ] **Step 3: Write `deploy/nginx-date-invite.conf`**

```nginx
server {
    listen 80;
    server_name 94-182-92-79.sslip.io;

    location = /meeting {
        return 301 /meeting/;
    }

    location /meeting/ {
        alias /var/www/date-invite/;
        index index.html;
        try_files $uri $uri/ /meeting/index.html;
    }
}
```

Note: `alias` + `try_files` can be finicky — if fallback fails, use `root /var/www` with files under `/var/www/meeting/` instead and keep Expo `baseUrl` `/meeting`. Prefer whichever works in verification.

- [ ] **Step 4: Deploy to server** (SSH as user `Cursor`)

```bash
sudo mkdir -p /var/www/date-invite
sudo chown -R Cursor:Cursor /var/www/date-invite
# upload dist/* into /var/www/date-invite
sudo cp deploy/nginx-date-invite.conf /etc/nginx/sites-available/date-invite
sudo ln -sf /etc/nginx/sites-available/date-invite /etc/nginx/sites-enabled/date-invite
sudo nginx -t && sudo systemctl reload nginx
```

Open UFW if needed:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

- [ ] **Step 5: Certbot**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 94-182-92-79.sslip.io --non-interactive --agree-tos -m admin@example.com || sudo certbot --nginx -d 94-182-92-79.sslip.io
```

- [ ] **Step 6: Verify**

Open `https://94-182-92-79.sslip.io/meeting` — full flow works; assets 200; HTTPS valid.

- [ ] **Step 7: Remind user to rotate SSH password** (shared in chat). Commit nginx sample only:

```bash
git add deploy/nginx-date-invite.conf .gitignore
git commit -m "chore: add Nginx deploy config for /meeting"
```

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| 4-step useState flow | 9 |
| Intro / Date / Order / Final cards | 5–8 |
| Progress + hearts | 4 |
| Jalali calendar | 2, 6 |
| AsyncStorage resume on final | 3, 9 |
| Animated (no Reanimated) | 4–9 |
| Bounce primary / vibrate bonus | 3, 5–8 |
| RTL Persian | 1, 5–8 |
| Attractiveness polish lines | 6, 8 |
| Expo Web + Nginx `/meeting` + SSL | 1, 10 |

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-29-date-invite.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with checkpoints  

Which approach?
