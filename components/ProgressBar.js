import { View, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme';

export default function ProgressBar({ step = 1, total = 4 }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => {
        const index = i + 1;
        const active = index <= step;
        return <View key={index} style={[styles.seg, active ? styles.segActive : styles.segIdle]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    gap: spacing.xs,
    marginBottom: spacing.md,
    width: '100%',
  },
  seg: {
    flex: 1,
    height: 4,
    borderRadius: radii.pill,
  },
  segActive: {
    backgroundColor: colors.primary,
  },
  segIdle: {
    backgroundColor: 'rgba(233, 30, 99, 0.2)',
  },
});
