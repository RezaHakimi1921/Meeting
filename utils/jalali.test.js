const {
  toFaDigits,
  formatDateLabel,
  getMonthGrid,
  WEEKDAYS_FA,
  MONTHS_FA,
  todayJalali,
  isDateSelectable,
  addDaysJalali,
  monthHasSelectableDays,
  shiftJalaliMonth,
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

test('14-day window allows today and blocks day 20', () => {
  const t = todayJalali();
  expect(isDateSelectable(t.jy, t.jm, t.jd, 14)).toBe(true);
  const far = addDaysJalali(t.jy, t.jm, t.jd, 20);
  expect(isDateSelectable(far.jy, far.jm, far.jd, 14)).toBe(false);
  const edge = addDaysJalali(t.jy, t.jm, t.jd, 14);
  expect(isDateSelectable(edge.jy, edge.jm, edge.jd, 14)).toBe(true);
});

test('month navigation helpers respect selectable window', () => {
  const t = todayJalali();
  expect(monthHasSelectableDays(t.jy, t.jm, 14)).toBe(true);
  const farMonth = shiftJalaliMonth(t.jy, t.jm, 3);
  expect(monthHasSelectableDays(farMonth.jy, farMonth.jm, 14)).toBe(false);
});
