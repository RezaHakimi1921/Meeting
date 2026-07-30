import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

/**
 * Occasional tiny hearts drifting upward — sparse, not noisy.
 */
export default function FloatingHearts() {
  const hearts = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        left: `${12 + ((i * 17) % 70)}%`,
        delay: i * 2200,
        size: 11 + (i % 3) * 2,
        drift: (i % 2 === 0 ? 1 : -1) * (8 + i * 2),
      })),
    []
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {hearts.map((h) => (
        <Heart key={h.id} {...h} />
      ))}
    </View>
  );
}

function Heart({ left, delay, size, drift }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 4200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(1800),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [40, -120] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const opacity = anim.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 0.45, 0.25, 0] });

  return (
    <Animated.Text
      style={[
        styles.heart,
        {
          left,
          bottom: '18%',
          fontSize: size,
          opacity,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    >
      ♥
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  heart: {
    position: 'absolute',
    color: '#F7C6D6',
  },
});
