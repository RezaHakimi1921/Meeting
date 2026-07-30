import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

const MOTIFS = [
  { glyph: '✧', left: '10%', top: '14%', delay: 0, size: 16 },
  { glyph: '♡', left: '82%', top: '20%', delay: 350, size: 18 },
  { glyph: '❀', left: '18%', top: '72%', delay: 700, size: 15 },
  { glyph: '✧', left: '76%', top: '68%', delay: 200, size: 14 },
  { glyph: '♡', left: '48%', top: '8%', delay: 500, size: 13 },
  { glyph: '✧', left: '8%', top: '48%', delay: 900, size: 12 },
];

function Motif({ glyph, left, top, delay, size }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.4, 0.15] });
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '8deg'] });

  return (
    <Animated.Text
      style={[
        styles.motif,
        { left, top, fontSize: size, opacity, transform: [{ translateY }, { rotate }] },
      ]}
    >
      {glyph}
    </Animated.Text>
  );
}

export default function BackgroundHearts() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.wash} />
      {MOTIFS.map((m, i) => (
        <Motif key={i} {...m} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  motif: {
    position: 'absolute',
    color: '#F7C6D6',
  },
});
