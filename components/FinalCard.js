import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { bounce, tryVibrate } from '../utils/tapFeedback';

const BOT_URL = 'https://t.me/Meetingir_mir_bot';
const CONFETTI = ['🎉', '✨', '💕', '💗', '🌸', '💖', '⭐', '🎀'];

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        emoji: CONFETTI[i % CONFETTI.length],
        left: `${6 + (i * 5.5) % 88}%`,
        delay: (i % 5) * 90,
        drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 7) * 3),
      })),
    []
  );

  return (
    <View pointerEvents="none" style={styles.confettiLayer}>
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} {...p} />
      ))}
    </View>
  );
}

function ConfettiPiece({ emoji, left, delay, drift }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 1600, useNativeDriver: true }),
    ]).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 120] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const opacity = anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] });

  return (
    <Animated.Text
      style={[
        styles.confetti,
        { left, opacity, transform: [{ translateY }, { translateX }] },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function FinalCard({
  selectedDate,
  selectedTime,
  selectedOrder,
  submitted,
  submitting,
  onSubmit,
  onReset,
}) {
  const primaryScale = useRef(new Animated.Value(1)).current;
  const secondaryScale = useRef(new Animated.Value(1)).current;
  const [localDone, setLocalDone] = useState(false);
  const clock = selectedTime?.labelFa || selectedTime?.label || '';
  const done = submitted || localDone;

  const message = `خوشحالم نگفتی نه! پس ${selectedDate?.weekdayFa ?? ''} ${selectedDate?.label ?? ''} ساعت ${clock}، دنبالت میام برای ${selectedOrder?.label ?? ''} 🚗`;

  const handleSubmit = async () => {
    if (done || submitting) return;
    bounce(primaryScale);
    tryVibrate();
    const ok = await onSubmit?.();
    if (ok) setLocalDone(true);
  };

  const handleOwnLink = () => {
    bounce(secondaryScale);
    tryVibrate();
    Linking.openURL(BOT_URL);
  };

  return (
    <View style={styles.card}>
      <ConfettiBurst />
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.warm}>منتظرتم با لبخند 🌸</Text>
      <Text style={styles.footnote}>
        برای اینکه ازت درخواست کنم یه وبسایت طراحی کردم، چیز مهمی نبود 🎀
      </Text>

      <Animated.View style={{ transform: [{ scale: primaryScale }] }}>
        <Pressable
          onPress={handleSubmit}
          disabled={done || submitting}
          style={[styles.primaryBtn, (done || submitting) && styles.btnDisabled]}
        >
          <Text style={styles.primaryText}>
            {done ? 'ثبت شد 💕' : submitting ? 'داره ثبت می‌شه...' : 'بزن بریم، ثبتش کن 💌'}
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: secondaryScale }] }}>
        <Pressable onPress={handleOwnLink} style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>لینک دعوت خودت رو بساز ✨</Text>
        </Pressable>
      </Animated.View>

      <Text style={styles.hint}>با ساخت لینک خودت می‌تونی برای کس دیگه‌ای هم دعوت بفرستی</Text>

      <Pressable onPress={onReset} hitSlop={8}>
        <Text style={styles.reset}>از اول</Text>
      </Pressable>
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
    overflow: 'hidden',
    shadowColor: '#E91E63',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  confetti: {
    position: 'absolute',
    top: 8,
    fontSize: 16,
  },
  emoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  warm: {
    color: colors.primary,
    fontSize: 15,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  footnote: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  secondaryBtn: {
    backgroundColor: '#FFF0F6',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  reset: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.45,
  },
});
