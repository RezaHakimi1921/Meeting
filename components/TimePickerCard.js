import { useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { toFaDigits } from '../utils/jalali';
import { bounce, tryVibrate } from '../utils/tapFeedback';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 10); // 10..23
const MINUTES = [0, 15, 30, 45];

function pad2(n) {
  return String(n).padStart(2, '0');
}

export default function TimePickerCard({ onNext, initialTime }) {
  const [hour, setHour] = useState(initialTime?.hour ?? 19);
  const [minute, setMinute] = useState(initialTime?.minute ?? 0);
  const btnScale = useRef(new Animated.Value(1)).current;

  const label = `${pad2(hour)}:${pad2(minute)}`;
  const labelFa = toFaDigits(label);

  const handleNext = () => {
    bounce(btnScale);
    tryVibrate();
    onNext?.({ hour, minute, label, labelFa });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>ساعت چند بیام دنبالت؟</Text>
      <Text style={styles.subtitle}>یه ساعت قشنگ انتخاب کن، سر وقت می‌رسم ⏰</Text>

      <Text style={styles.preview}>{labelFa}</Text>

      <Text style={styles.section}>ساعت</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
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

      <Animated.View style={{ transform: [{ scale: btnScale }] }}>
        <Pressable onPress={handleNext} style={styles.nextBtn}>
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
  preview: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: 2,
  },
  section: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row-reverse',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  minuteRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  chip: {
    minWidth: 52,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: '#FFF9FC',
    borderWidth: 2,
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
    fontSize: 15,
  },
  chipTextActive: {
    color: colors.primary,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
