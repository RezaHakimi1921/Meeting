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
  formatDateLabel,
  getMonthGrid,
};
