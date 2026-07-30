import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';
import { bounce, tryVibrate } from '../utils/tapFeedback';
import LetterSheet from './LetterSheet';

const OPTIONS = [
  { id: 'pizza', emoji: '🍕', label: 'پیتزا' },
  { id: 'coffee', emoji: '☕', label: 'قهوه' },
  { id: 'kebab', emoji: '🍢', label: 'کوبیده' },
  { id: 'dessert', emoji: '🍒', label: 'دسر' },
];

export default function OrderPickerCard({ onConfirm }) {
  const [selected, setSelected] = useState(null);
  const btnScale = useRef(new Animated.Value(1)).current;
  const ink = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!selected) return;
    ink.setValue(0);
    Animated.timing(ink, { toValue: 1, duration: 380, useNativeDriver: true }).start();
  }, [selected, ink]);

  const handleConfirm = () => {
    if (!selected) return;
    bounce(btnScale);
    tryVibrate();
    onConfirm?.(selected);
  };

  return (
    <LetterSheet stamp={'منو\nنامه'}>
      <Text style={styles.eyebrow}>یک خط از نامه…</Text>
      <Text style={styles.title}>چی سفارش می‌دی؟</Text>
      <Text style={styles.subtitle}>یه چیز خوشمزه بنویس تو نامه، مهمون منی</Text>

      <View style={styles.grid}>
        {OPTIONS.map((opt) => {
          const active = selected?.id === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => setSelected(opt)}
              style={[styles.option, active && styles.optionActive]}
            >
              <Text style={styles.optionEmoji}>{opt.emoji}</Text>
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <Animated.Text style={[styles.inkLine, { opacity: ink }]}>
          با خط خودم نوشتم: «{selected.label}»
        </Animated.Text>
      ) : null}

      <Animated.View style={{ transform: [{ scale: btnScale }] }}>
        <Pressable
          disabled={!selected}
          onPress={handleConfirm}
          style={[styles.cta, !selected && styles.ctaDisabled]}
        >
          <Text style={styles.ctaText}>مُهر بزن و بفرست 💌</Text>
        </Pressable>
      </Animated.View>
    </LetterSheet>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: fonts.body,
    color: colors.wax,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontSize: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  option: {
    width: '47%',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.paperEdge,
    backgroundColor: '#FFFCFD',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  optionActive: {
    borderColor: colors.wax,
    backgroundColor: '#FFE9F1',
  },
  optionEmoji: { fontSize: 28, marginBottom: 6 },
  optionLabel: {
    fontFamily: fonts.body,
    color: colors.ink,
    fontWeight: '600',
    fontSize: 15,
  },
  optionLabelActive: { color: colors.waxDeep },
  inkLine: {
    fontFamily: fonts.body,
    color: colors.wax,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
    fontSize: 14,
  },
  cta: {
    backgroundColor: colors.wax,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: {
    fontFamily: fonts.body,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
