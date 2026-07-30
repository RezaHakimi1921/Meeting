import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';

/**
 * Shared "love letter" paper — slightly smaller for more margin / luxury feel.
 */
export default function LetterSheet({ children, stamp, style, dropIn = true }) {
  const lift = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const wax = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: dropIn ? 520 : 360, useNativeDriver: true }),
      Animated.spring(lift, {
        toValue: 1,
        friction: dropIn ? 6 : 8,
        tension: dropIn ? 48 : 62,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(wax, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(wax, { toValue: 0.92, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [fade, lift, wax, dropIn]);

  const translateY = lift.interpolate({
    inputRange: [0, 1],
    outputRange: dropIn ? [-48, 0] : [24, 0],
  });
  const scale = lift.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  const rotate = lift.interpolate({ inputRange: [0, 1], outputRange: ['1.4deg', '0deg'] });

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
    maxWidth: 380,
    alignSelf: 'center',
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
    height: 3,
    backgroundColor: colors.gold,
    opacity: 0.32,
  },
  shadow: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: -7,
    height: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 1,
  },
  rule: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 24,
    width: 1,
    backgroundColor: 'rgba(184, 59, 94, 0.1)',
  },
  rule2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 28,
    width: 1,
    backgroundColor: 'rgba(184, 59, 94, 0.06)',
  },
  stampWrap: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201,162,39,0.08)',
  },
  stamp: {
    fontFamily: fonts.display,
    color: colors.wax,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
