import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing, weights } from '../theme';
import {
  MONTHS_FA,
  WEEKDAYS_FA,
  formatDateLabel,
  getMonthGrid,
  isDateSelectable,
  monthHasSelectableDays,
  shiftJalaliMonth,
  toFaDigits,
  todayJalali,
} from '../utils/jalali';
import { bounce, tryVibrate } from '../utils/tapFeedback';
import { playPaperFlip, unlockAudio } from '../utils/sound';
import LetterSheet from './LetterSheet';
import { TimeWheel } from './WheelPicker';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 10);
const MINUTES = [0, 15, 30, 45];
const MAX_DAYS_AHEAD = 14;
const WINDOW_HINTS = [
  'بیا زیاد منتظر نمونه ✨',
  'دو هفتهٔ بعد بهترین زمانه ❤️',
  'یه روز از ۱۴ روز آینده رو انتخاب کن ☕',
  'هرچی زودتر، قشنگ‌تره 💕',
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

export default function DateTimePickerCard({ onNext, initialDate, initialTime }) {
  const today = useMemo(() => todayJalali(), []);
  const hint = useMemo(
    () => WINDOW_HINTS[Math.floor(Math.random() * WINDOW_HINTS.length)],
    []
  );
  const [jy, setJy] = useState(initialDate?.jy ?? today.jy);
  const [jm, setJm] = useState(initialDate?.jm ?? today.jm);
  const [selected, setSelected] = useState(() => {
    if (
      initialDate &&
      isDateSelectable(initialDate.jy, initialDate.jm, initialDate.jd, MAX_DAYS_AHEAD)
    ) {
      return initialDate;
    }
    return null;
  });
  const [hour, setHour] = useState(initialTime?.hour ?? 19);
  const [minute, setMinute] = useState(initialTime?.minute ?? 0);
  const hourRef = useRef(hour);
  const minuteRef = useRef(minute);
  const [affirm, setAffirm] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    hourRef.current = hour;
  }, [hour]);
  useEffect(() => {
    minuteRef.current = minute;
  }, [minute]);

  const setHourSafe = (h) => {
    hourRef.current = h;
    setHour(h);
  };
  const setMinuteSafe = (m) => {
    minuteRef.current = m;
    setMinute(m);
  };

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 480, useNativeDriver: true }).start();
  }, [fadeIn]);

  const grid = useMemo(() => getMonthGrid(jy, jm), [jy, jm]);
  const timeLabel = `${pad2(hour)}:${pad2(minute)}`;
  const timeLabelFa = toFaDigits(timeLabel);

  const canGoPrev = useMemo(() => {
    const prev = shiftJalaliMonth(jy, jm, -1);
    return monthHasSelectableDays(prev.jy, prev.jm, MAX_DAYS_AHEAD);
  }, [jy, jm]);

  const canGoNext = useMemo(() => {
    const next = shiftJalaliMonth(jy, jm, 1);
    return monthHasSelectableDays(next.jy, next.jm, MAX_DAYS_AHEAD);
  }, [jy, jm]);

  const shiftMonth = (delta) => {
    if (delta < 0 && !canGoPrev) return;
    if (delta > 0 && !canGoNext) return;
    const next = shiftJalaliMonth(jy, jm, delta);
    setJy(next.jy);
    setJm(next.jm);
  };

  const pickDay = (cell) => {
    if (!cell.inMonth || cell.jd == null) return;
    if (!isDateSelectable(cell.jy, cell.jm, cell.jd, MAX_DAYS_AHEAD)) return;
    const meta = formatDateLabel(cell.jy, cell.jm, cell.jd);
    setSelected({
      jy: cell.jy,
      jm: cell.jm,
      jd: cell.jd,
      weekdayFa: meta.weekdayFa,
      label: meta.label,
    });
  };

  const handleNext = () => {
    if (!selected || affirm) return;
    bounce(btnScale);
    tryVibrate();
    unlockAudio();
    playPaperFlip();
    setAffirm(true);
    const h = hourRef.current;
    const m = minuteRef.current;
    const label = `${pad2(h)}:${pad2(m)}`;
    const time = { hour: h, minute: m, label, labelFa: toFaDigits(label) };
    setTimeout(() => onNext?.({ date: selected, time }), 700);
  };

  return (
    <LetterSheet stamp={'صفحه\nدوم'} style={styles.sheet} dropIn={false}>
      <Animated.View style={[styles.inner, { opacity: fadeIn }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <Text style={styles.eyebrow}>روی کاغذ نامه بنویس</Text>
          <Text style={styles.title}>کی و ساعت چند بریم بیرون؟</Text>
          <Text style={styles.subtitle}>روز و ساعت رو با جوهر انتخاب کن</Text>
          <Text style={styles.windowHint}>{hint}</Text>

          <View style={styles.monthRow}>
            <Pressable
              onPress={() => shiftMonth(1)}
              disabled={!canGoNext}
              style={[styles.navBtn, !canGoNext && styles.navDisabled]}
            >
              <Text style={[styles.navText, !canGoNext && styles.navTextDisabled]}>›</Text>
            </Pressable>
            <Text style={styles.monthLabel}>
              {MONTHS_FA[jm - 1]} {toFaDigits(jy)}
            </Text>
            <Pressable
              onPress={() => shiftMonth(-1)}
              disabled={!canGoPrev}
              style={[styles.navBtn, !canGoPrev && styles.navDisabled]}
            >
              <Text style={[styles.navText, !canGoPrev && styles.navTextDisabled]}>‹</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS_FA.map((d) => (
              <Text key={d} style={styles.weekHead}>
                {d.slice(0, 1)}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {grid.map((cell, idx) => {
              const selectable =
                cell.inMonth &&
                cell.jd != null &&
                isDateSelectable(cell.jy, cell.jm, cell.jd, MAX_DAYS_AHEAD);
              const disabled = !selectable;
              const isSelected =
                selected &&
                selected.jy === cell.jy &&
                selected.jm === cell.jm &&
                selected.jd === cell.jd;
              return (
                <Pressable
                  key={idx}
                  disabled={disabled}
                  onPress={() => pickDay(cell)}
                  style={[styles.day, isSelected && styles.daySelected, disabled && styles.dayDisabled]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      disabled && styles.dayTextDisabled,
                    ]}
                  >
                    {cell.inMonth && cell.jd != null ? toFaDigits(cell.jd) : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.section}>ساعت · {timeLabelFa}</Text>
          <TimeWheel
            hour={hour}
            minute={minute}
            onHour={setHourSafe}
            onMinute={setMinuteSafe}
            hours={HOURS}
            minutes={MINUTES}
          />

          {affirm ? <Text style={styles.affirm}>با جوهر قرمز تو نامه ثبت شد…</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              disabled={!selected || affirm}
              onPress={handleNext}
              style={[styles.nextBtn, (!selected || affirm) && styles.nextDisabled]}
            >
              <Text style={styles.nextText}>ورق بزن</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </LetterSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { maxHeight: '76vh' },
  inner: { maxHeight: '68vh' },
  scroll: { flexGrow: 1, flexShrink: 1 },
  scrollContent: { paddingBottom: spacing.xs },
  footer: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.paperEdge,
  },
  eyebrow: {
    fontFamily: fonts.body,
    color: colors.wax,
    fontSize: 12,
    fontWeight: weights.medium,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.body,
    color: colors.ink,
    fontSize: 17,
    fontWeight: weights.semibold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontSize: 12,
    fontWeight: weights.medium,
    marginTop: 4,
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  windowHint: {
    fontFamily: fonts.body,
    color: colors.wax,
    fontSize: 13,
    fontWeight: weights.medium,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(184,59,94,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  monthLabel: {
    fontFamily: fonts.body,
    color: colors.ink,
    fontSize: 13,
    fontWeight: weights.semibold,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8E6EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDisabled: {
    opacity: 0.28,
  },
  navText: { fontSize: 16, color: colors.wax, lineHeight: 18 },
  navTextDisabled: { color: colors.muted },
  weekRow: { flexDirection: 'row-reverse', marginBottom: 2 },
  weekHead: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 10,
    fontFamily: fonts.body,
    fontWeight: weights.medium,
  },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', marginBottom: spacing.sm },
  day: {
    width: `${100 / 7}%`,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  daySelected: { backgroundColor: colors.wax },
  dayDisabled: { opacity: 0.28 },
  dayText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: weights.medium,
    fontFamily: fonts.body,
  },
  dayTextSelected: { color: '#fff' },
  dayTextDisabled: { color: colors.muted },
  section: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 6,
    fontFamily: fonts.body,
    fontWeight: weights.medium,
  },
  affirm: {
    color: colors.wax,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: spacing.xs,
    fontSize: 12,
    fontFamily: fonts.body,
    fontWeight: weights.medium,
  },
  nextBtn: {
    backgroundColor: colors.wax,
    borderRadius: radii.pill,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  nextDisabled: { opacity: 0.45 },
  nextText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: weights.semibold,
    fontFamily: fonts.body,
  },
});
