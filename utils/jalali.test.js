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
