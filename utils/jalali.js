const jalaali = require('jalaali-js');

const WEEKDAYS_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const MONTHS_FA = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
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

/** Inclusive: today + maxDaysAhead (default 14). */
function addDaysJalali(jy, jm, jd, days) {
  const g = jalaali.toGregorian(jy, jm, jd);
  const d = new Date(g.gy, g.gm - 1, g.gd);
  d.setDate(d.getDate() + days);
  return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function compareJalali(a, b) {
  if (a.jy !== b.jy) return a.jy - b.jy;
  if (a.jm !== b.jm) return a.jm - b.jm;
  return a.jd - b.jd;
}

function isAfterMaxDay(jy, jm, jd, maxDaysAhead = 14) {
  const t = todayJalali();
  const max = addDaysJalali(t.jy, t.jm, t.jd, maxDaysAhead);
  return compareJalali({ jy, jm, jd }, max) > 0;
}

/** Day is pickable: today .. today+maxDaysAhead inclusive. */
function isDateSelectable(jy, jm, jd, maxDaysAhead = 14) {
  if (jd == null) return false;
  if (isBeforeToday(jy, jm, jd)) return false;
  if (isAfterMaxDay(jy, jm, jd, maxDaysAhead)) return false;
  return true;
}

/** True if month (jy,jm) has at least one selectable day. */
function monthHasSelectableDays(jy, jm, maxDaysAhead = 14) {
  const daysInMonth = jalaali.jalaaliMonthLength(jy, jm);
  for (let jd = 1; jd <= daysInMonth; jd += 1) {
    if (isDateSelectable(jy, jm, jd, maxDaysAhead)) return true;
  }
  return false;
}

function shiftJalaliMonth(jy, jm, delta) {
  let nextJm = jm + delta;
  let nextJy = jy;
  if (nextJm < 1) {
    nextJm = 12;
    nextJy -= 1;
  } else if (nextJm > 12) {
    nextJm = 1;
    nextJy += 1;
  }
  return { jy: nextJy, jm: nextJm };
}

/** JS getDay(): 0=Sun … 6=Sat → index in WEEKDAYS_FA (شنبه=0) */
function gregorianWeekdayToFaIndex(date) {
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
  isAfterMaxDay,
  isDateSelectable,
  monthHasSelectableDays,
  shiftJalaliMonth,
  addDaysJalali,
  formatDateLabel,
  getMonthGrid,
};
