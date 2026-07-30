import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';
import { bounce, tryVibrate } from '../utils/tapFeedback';
import LetterSheet from './LetterSheet';

const BOT_URL = 'https://B2n.ir/md3187';
const CONFETTI = ['💌', '✨', '💕', '🎀', '🌸', '✧', '♥', '✿'];

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        emoji: CONFETTI[i % CONFETTI.length],
        left: `${6 + (i * 6) % 88}%`,
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
    <Animated.Text style={[styles.confetti, { left, opacity, transform: [{ translateY }, { translateX }] }]}>
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
  const seal = useRef(new Animated.Value(0)).current;
  const [localDone, setLocalDone] = useState(false);
  const clock = selectedTime?.labelFa || selectedTime?.label || '';
  const done = submitted || localDone;

  useEffect(() => {
    Animated.spring(seal, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }).start();
  }, [seal]);

  const message = `خوشحالم نگفتی نه! پس ${selectedDate?.weekdayFa ?? ''} ${selectedDate?.label ?? ''} ساعت ${clock} برای ${selectedOrder?.label ?? ''} مهمون منی، بریم بیرون به انتخاب من 💕`;

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

  const sealScale = seal.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <LetterSheet stamp={'پایان\nنامه'}>
      <ConfettiBurst />
      <Animated.View style={[styles.sealBig, { transform: [{ scale: sealScale }] }]}>
        <Text style={styles.sealBigText}>مُهر شد</Text>
      </Animated.View>
      <Text style={styles.eyebrow}>نامه تمام… تقریباً</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.warm}>منتظرتم با لبخند — مثل آخرین خط یک نامه</Text>
      <Text style={styles.footnote}>برای اینکه ازت درخواست کنم، این نامهٔ دیجیتال رو نوشتم 🎀</Text>

      <Animated.View style={{ transform: [{ scale: primaryScale }] }}>
        <Pressable
          onPress={handleSubmit}
          disabled={done || submitting}
          style={[styles.primaryBtn, (done || submitting) && styles.btnDisabled]}
        >
          <Text style={styles.primaryText}>
            {done ? 'نامه ارسال شد 💕' : submitting ? 'داره مُهر می‌خوره...' : 'بزن بریم، ثبتش کن 💌'}
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: secondaryScale }] }}>
        <Pressable onPress={handleOwnLink} style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>نامهٔ دعوت خودت رو بنویس ✨</Text>
        </Pressable>
      </Animated.View>

      <Text style={styles.hint}>با ساخت لینک خودت می‌تونی برای کس دیگه‌ای هم نامه بفرستی</Text>

      <Pressable onPress={onReset} hitSlop={8}>
        <Text style={styles.reset}>از اول بنویس</Text>
      </Pressable>
    </LetterSheet>
  );
}

const styles = StyleSheet.create({
  confettiLayer: { ...StyleSheet.absoluteFillObject },
  confetti: { position: 'absolute', top: 8, fontSize: 16 },
  sealBig: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.waxDeep,
    borderWidth: 3,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  sealBigText: { color: '#fff', fontWeight: '700', fontFamily: fonts.body, fontSize: 13 },
  eyebrow: {
    fontFamily: fonts.body,
    color: colors.wax,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },
  message: {
    fontFamily: fonts.body,
    color: colors.ink,
    fontSize: 17,
    lineHeight: 30,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  warm: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  footnote: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: colors.wax,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: fonts.body },
  secondaryBtn: {
    borderRadius: radii.pill,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.wax,
    marginBottom: spacing.sm,
    backgroundColor: '#FFF8FA',
  },
  secondaryText: { color: colors.waxDeep, fontSize: 14, fontWeight: '700', fontFamily: fonts.body },
  btnDisabled: { opacity: 0.55 },
  hint: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  reset: {
    fontFamily: fonts.body,
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
