import { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import {
  MONTHS_FA,
  WEEKDAYS_FA,
  formatDateLabel,
  getMonthGrid,
  isBeforeToday,
  toFaDigits,
  todayJalali,
} from '../utils/jalali';
import { bounce, tryVibrate } from '../utils/tapFeedback';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 10); // 10..23
const MINUTES = [0, 15, 30, 45];

function pad2(n) {
  return String(n).padStart(2, '0');
}

export default function DateTimePickerCard({ onNext, initialDate, initialTime }) {
  const today = useMemo(() => todayJalali(), []);
  const [jy, setJy] = useState(initialDate?.jy ?? today.jy);
  const [jm, setJm] = useState(initialDate?.jm ?? today.jm);
  const [selected, setSelected] = useState(initialDate ?? null);
  const [hour, setHour] = useState(initialTime?.hour ?? 19);
  const [minute, setMinute] = useState(initialTime?.minute ?? 0);
  const [affirm, setAffirm] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;

  const grid = useMemo(() => getMonthGrid(jy, jm), [jy, jm]);
  const timeLabel = `${pad2(hour)}:${pad2(minute)}`;
  const timeLabelFa = toFaDigits(timeLabel);

  const shiftMonth = (delta) => {
    let nextJm = jm + delta;
    let nextJy = jy;
    if (nextJm < 1) {
      nextJm = 12;
      nextJy -= 1;
    } else if (nextJm > 12) {
      nextJm = 1;
      nextJy += 1;
    }
    if (nextJy < today.jy || (nextJy === today.jy && nextJm < today.jm)) {
      return;
    }
    setJy(nextJy);
    setJm(nextJm);
  };

  const pickDay = (cell) => {
    if (!cell.inMonth || cell.jd == null) return;
    if (isBeforeToday(cell.jy, cell.jm, cell.jd)) return;
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
    setAffirm(true);
    const time = { hour, minute, label: timeLabel, labelFa: timeLabelFa };
    setTimeout(() => onNext?.({ date: selected, time }), 700);
  };

  return (
    <View style={styles.card}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>کی و ساعت چند بریم بیرون؟</Text>
        <Text style={styles.subtitle}>روز و ساعت رو با هم انتخاب کن 💕</Text>

        <View style={styles.monthRow}>
          <Pressable onPress={() => shiftMonth(1)} style={styles.navBtn}>
            <Text style={styles.navText}>›</Text>
          </Pressable>
          <Text style={styles.monthLabel}>
            {MONTHS_FA[jm - 1]} {toFaDigits(jy)}
          </Text>
          <Pressable onPress={() => shiftMonth(-1)} style={styles.navBtn}>
            <Text style={styles.navText}>‹</Text>
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
            const disabled =
              !cell.inMonth || cell.jd == null || isBeforeToday(cell.jy, cell.jm, cell.jd);
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
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {HOURS.map((h) => {
            const active = hour === h;
            return (
              <Pressable
                key={h}
                onPress={() => setHour(h)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {toFaDigits(pad2(h))}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.section}>دقیقه</Text>
        <View style={styles.minuteRow}>
          {MINUTES.map((m) => {
            const active = minute === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMinute(m)}
                style={[styles.chip, styles.minuteChip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {toFaDigits(pad2(m))}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {affirm ? <Text style={styles.affirm}>عالی… تو تقویم قلبم زدم 💗</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            disabled={!selected || affirm}
            onPress={handleNext}
            style={[styles.nextBtn, (!selected || affirm) && styles.nextDisabled]}
          >
            <Text style={styles.nextText}>بعدی</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    width: '100%',
    maxWidth: 420,
    maxHeight: '78vh',
    overflow: 'hidden',
    shadowColor: '#E91E63',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  scroll: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F3E0EA',
    backgroundColor: colors.card,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: spacing.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  monthLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F8EAF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 18,
    color: colors.primary,
    lineHeight: 20,
  },
  weekRow: {
    flexDirection: 'row-reverse',
    marginBottom: 2,
  },
  weekHead: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  day: {
    width: `${100 / 7}%`,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayDisabled: {
    opacity: 0.35,
  },
  dayText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#fff',
  },
  dayTextDisabled: {
    color: colors.muted,
  },
  section: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row-reverse',
    gap: 6,
    paddingVertical: 4,
  },
  minuteRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.xs,
  },
  chip: {
    minWidth: 44,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: '#FFF9FC',
    borderWidth: 1.5,
    borderColor: '#F3E0EA',
    alignItems: 'center',
  },
  minuteChip: {
    flexGrow: 1,
  },
  chipActive: {
    backgroundColor: '#FFE8F1',
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.primary,
  },
  affirm: {
    color: colors.primary,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: spacing.xs,
    fontSize: 13,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 13,
    alignItems: 'center',
  },
  nextDisabled: {
    opacity: 0.45,
  },
  nextText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
