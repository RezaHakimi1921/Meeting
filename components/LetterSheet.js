import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';

/**
 * Shared "love letter" paper sheet with enter animation + wax seal pulse.
 */
export default function LetterSheet({ children, stamp, style }) {
  const lift = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const wax = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.spring(lift, { toValue: 1, friction: 7, tension: 58, useNativeDriver: true }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(wax, { toValue: 1.06, duration: 1100, useNativeDriver: true }),
        Animated.timing(wax, { toValue: 0.92, duration: 1100, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [fade, lift, wax]);

  const translateY = lift.interpolate({ inputRange: [0, 1], outputRange: [32, 0] });
  const scale = lift.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  const rotate = lift.interpolate({ inputRange: [0, 1], outputRange: ['1.2deg', '0deg'] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        style,
        { opacity: fade, transform: [{ translateY }, { scale }, { rotate }] },
      ]}
    >
      <View style={styles.paper}>
        <View style={styles.edgeGlow} />
        <View style={styles.rule} />
        <View style={styles.rule2} />
        {stamp ? (
          <Animated.View style={[styles.stampWrap, { transform: [{ rotate: '-8deg' }, { scale: wax }] }]}>
            <Text style={styles.stamp}>{stamp}</Text>
          </Animated.View>
        ) : null}
        {children}
      </View>
      <View style={styles.shadow} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 420,
    position: 'relative',
  },
  paper: {
    backgroundColor: colors.paper,
    borderRadius: radii.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.paperEdge,
    overflow: 'hidden',
    zIndex: 2,
  },
  edgeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.gold,
    opacity: 0.35,
  },
  shadow: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: -8,
    height: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.22)',
    zIndex: 1,
  },
  rule: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 28,
    width: 1,
    backgroundColor: 'rgba(184, 59, 94, 0.12)',
  },
  rule2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 32,
    width: 1,
    backgroundColor: 'rgba(184, 59, 94, 0.08)',
  },
  stampWrap: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.gold,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201,162,39,0.1)',
  },
  stamp: {
    fontFamily: fonts.display,
    color: colors.wax,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
