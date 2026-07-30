import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';

function Seal({ active, current }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!current) {
      pulse.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.35, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [current, pulse]);

  return (
    <Animated.View
      style={[
        styles.seal,
        active ? styles.sealActive : styles.sealIdle,
        { transform: [{ scale: current ? pulse : 1 }] },
      ]}
    />
  );
}

export default function ProgressBar({ step = 1, total = 4 }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => {
        const index = i + 1;
        return <Seal key={index} active={index <= step} current={index === step} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  seal: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  sealActive: {
    backgroundColor: colors.wax,
    borderColor: colors.gold,
  },
  sealIdle: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(247,198,214,0.45)',
  },
});
