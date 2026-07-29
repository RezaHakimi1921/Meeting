import { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
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

export default function DatePickerCard({ onNext }) {
  const today = useMemo(() => todayJalali(), []);
  const [jy, setJy] = useState(today.jy);
  const [jm, setJm] = useState(today.jm);
  const [selected, setSelected] = useState(null);
  const [affirm, setAffirm] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;

  const grid = useMemo(() => getMonthGrid(jy, jm), [jy, jm]);

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
    setTimeout(() => onNext?.(selected), 900);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>کی بریم؟</Text>
      <Text style={styles.subtitle}>یه روز قشنگ از تقویم قلب انتخاب کن 📅</Text>

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
          const disabled = !cell.inMonth || cell.jd == null || isBeforeToday(cell.jy, cell.jm, cell.jd);
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
              style={[
                styles.day,
                isSelected && styles.daySelected,
                disabled && styles.dayDisabled,
              ]}
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

      {affirm ? (
        <Text style={styles.affirm}>عالی… همون روز رو تو تقویم قلبم زدم 💗</Text>
      ) : null}

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
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#E91E63',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8EAF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 22,
    color: colors.primary,
    lineHeight: 24,
  },
  weekRow: {
    flexDirection: 'row-reverse',
    marginBottom: spacing.xs,
  },
  weekHead: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayDisabled: {
    opacity: 0.35,
  },
  dayText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#fff',
  },
  dayTextDisabled: {
    color: colors.muted,
  },
  affirm: {
    color: colors.primary,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextDisabled: {
    opacity: 0.45,
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
