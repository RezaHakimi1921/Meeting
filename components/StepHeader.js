import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

export default function StepHeader({ step, total = 5, onBack }) {
  const showBack = typeof onBack === 'function' && step > 1 && step < 5;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
            <Text style={styles.backText}>‹ قبلی</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <Text style={styles.hint}>
          مرحله {step} از {total}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  topRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  backPlaceholder: {
    width: 64,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    writingDirection: 'rtl',
  },
});
