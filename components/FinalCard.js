import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { bounce, tryVibrate } from '../utils/tapFeedback';

const SHARE_URL = 'http://94.182.92.79/meeting';
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

export default function FinalCard({ selectedDate, selectedTime, selectedOrder, onReset }) {
  const shareScale = useRef(new Animated.Value(1)).current;
  const clock = selectedTime?.labelFa || selectedTime?.label || '';

  const message = `خوشحالم نگفتی نه! پس ${selectedDate?.weekdayFa ?? ''} ${selectedDate?.label ?? ''} ساعت ${clock}، دنبالت میام برای ${selectedOrder?.label ?? ''} 🚗`;

  const shareText = `دعوت به قرار 💕 ${selectedDate?.weekdayFa ?? ''} ${selectedDate?.label ?? ''} ساعت ${clock} — ${selectedOrder?.emoji ?? ''} ${selectedOrder?.label ?? ''}\nمنتظرتم با لبخند 🌸\n${SHARE_URL}`;

  const handleShare = async () => {
    bounce(shareScale);
    tryVibrate();
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Date Invite', text: shareText, url: SHARE_URL });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        alert('کپی شد 💌');
        return;
      }
      alert(shareText);
    } catch {
      // user cancelled share — ignore
    }
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

      <Animated.View style={{ transform: [{ scale: shareScale }] }}>
        <Pressable onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareText}>اشتراک‌گذاری 💌</Text>
        </Pressable>
      </Animated.View>

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
  shareBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  shareText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  reset: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.45,
  },
});
