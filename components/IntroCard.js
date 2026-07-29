import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radii, spacing } from '../theme';
import { bounce, tryVibrate } from '../utils/tapFeedback';

export default function IntroCard({ onYes }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const yesScale = useRef(new Animated.Value(1)).current;
  const [noPos, setNoPos] = useState({ top: 8, left: 12 });

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const flee = () => {
    setNoPos({
      top: 4 + Math.random() * 70,
      left: 4 + Math.random() * 62,
    });
  };

  const handleYes = () => {
    bounce(yesScale);
    tryVibrate();
    onYes?.();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>🥺</Text>
      <Text style={styles.title}>با من میای سر قرار؟</Text>
      <Text style={styles.subtitle}>فقط یه سوال ساده‌ست... جواب درست هم فقط یکیشه 😏</Text>

      <View style={styles.actions}>
        <Animated.View style={{ transform: [{ scale: Animated.multiply(pulse, yesScale) }] }}>
          <Pressable onPress={handleYes} style={styles.yesBtn}>
            <Text style={styles.yesText}>آره 💕</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.noArena}>
          <Pressable
            onPressIn={flee}
            onHoverIn={Platform.OS === 'web' ? flee : undefined}
            style={[styles.noBtn, { top: `${noPos.top}%`, left: `${noPos.left}%` }]}
          >
            <Text style={styles.noText}>نه</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.hint}>آره همینجاست، منتظرته 💌</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#E91E63',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  emoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  yesBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  yesText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  noArena: {
    height: 88,
    position: 'relative',
    width: '100%',
  },
  noBtn: {
    position: 'absolute',
    backgroundColor: '#ECE7E9',
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  noText: {
    color: colors.noButton,
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
