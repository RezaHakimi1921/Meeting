import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';

export default function StepHeader({ step, total = 4, onBack }) {
  const showBack = typeof onBack === 'function' && step > 1 && step < total;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
            <Text style={styles.backText}>‹ ورق قبل</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <Text style={styles.hint}>
          صفحه {step} از {total} نامه
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
    color: '#F7C6D6',
    fontSize: 14,
    fontWeight: '500',
    writingDirection: 'rtl',
    fontFamily: fonts.body,
  },
  backPlaceholder: {
    width: 72,
  },
  hint: {
    color: 'rgba(247,198,214,0.75)',
    fontSize: 12,
    fontWeight: '500',
    writingDirection: 'rtl',
    fontFamily: fonts.body,
  },
});
