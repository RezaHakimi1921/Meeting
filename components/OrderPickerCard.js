import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { bounce, tryVibrate } from '../utils/tapFeedback';

const OPTIONS = [
  { id: 'pizza', emoji: '🍕', label: 'پیتزا' },
  { id: 'coffee', emoji: '☕', label: 'قهوه' },
  { id: 'kebab', emoji: '🍢', label: 'کوبیده' },
  { id: 'dessert', emoji: '🍒', label: 'دسر' },
];

export default function OrderPickerCard({ onConfirm }) {
  const [selected, setSelected] = useState(null);
  const btnScale = useRef(new Animated.Value(1)).current;

  const handleConfirm = () => {
    if (!selected) return;
    bounce(btnScale);
    tryVibrate();
    onConfirm?.(selected);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>چی سفارش میدی؟</Text>
      <Text style={styles.subtitle}>یه چیز خوشمزه انتخاب کن که مهمونت باشی</Text>

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
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View style={{ transform: [{ scale: btnScale }] }}>
        <Pressable
          disabled={!selected}
          onPress={handleConfirm}
          style={[styles.cta, !selected && styles.ctaDisabled]}
        >
          <Text style={styles.ctaText}>بریم که بریم 💌</Text>
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
    marginBottom: spacing.lg,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  option: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F3E0EA',
    backgroundColor: '#FFF9FC',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFE8F1',
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
