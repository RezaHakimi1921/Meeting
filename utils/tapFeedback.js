import { Animated, Platform } from 'react-native';

export function bounce(scaleAnim) {
  Animated.sequence([
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, friction: 5 }),
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
  ]).start();
}

export function tryVibrate(ms = 12) {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
}
