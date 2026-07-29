import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

const HEARTS = [
  { emoji: '💕', left: '8%', top: '12%', delay: 0, size: 22 },
  { emoji: '💗', left: '78%', top: '18%', delay: 400, size: 18 },
  { emoji: '💖', left: '18%', top: '68%', delay: 800, size: 20 },
  { emoji: '💕', left: '85%', top: '62%', delay: 200, size: 16 },
  { emoji: '💗', left: '50%', top: '8%', delay: 600, size: 14 },
  { emoji: '💖', left: '42%', top: '78%', delay: 1000, size: 18 },
  { emoji: '💕', left: '6%', top: '42%', delay: 300, size: 15 },
  { emoji: '💗', left: '70%', top: '40%', delay: 700, size: 17 },
];

function FloatingHeart({ emoji, left, top, delay, size }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.25, 0.55, 0.25] });

  return (
    <Animated.Text
      style={[
        styles.heart,
        {
          left,
          top,
          fontSize: size,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function BackgroundHearts() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {HEARTS.map((h, i) => (
        <FloatingHeart key={i} {...h} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heart: {
    position: 'absolute',
  },
});
