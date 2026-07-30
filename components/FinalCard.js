import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing, weights } from '../theme';
import { bounce, tryVibrate } from '../utils/tapFeedback';
import { playSealStamp, unlockAudio } from '../utils/sound';
import LetterSheet from './LetterSheet';
import TypewriterText from './TypewriterText';

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
  const fold = useRef(new Animated.Value(0)).current;
  const [localDone, setLocalDone] = useState(false);
  const [folded, setFolded] = useState(false);
  const clock = selectedTime?.labelFa || selectedTime?.label || '';
  const done = submitted || localDone;

  useEffect(() => {
    Animated.spring(seal, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }).start();
  }, [seal]);

  const message = `خوشحالم نگفتی نه! پس ${selectedDate?.weekdayFa ?? ''} ${selectedDate?.label ?? ''} ساعت ${clock} برای ${selectedOrder?.label ?? ''} مهمون منی، بریم بیرون به انتخاب من 💕`;

  const runFoldAway = () =>
    new Promise((resolve) => {
      Animated.timing(fold, { toValue: 1, duration: 900, useNativeDriver: true }).start(() => {
        setFolded(true);
        resolve();
      });
    });

  const handleSubmit = async () => {
    if (done || submitting) return;
    bounce(primaryScale);
    tryVibrate();
    unlockAudio();
    playSealStamp();
    const ok = await onSubmit?.();
    if (ok) {
      setLocalDone(true);
      await runFoldAway();
    }
  };

  const handleOwnLink = () => {
    bounce(secondaryScale);
    tryVibrate();
    Linking.openURL(BOT_URL);
  };

  const sealScale = seal.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const foldScaleY = fold.interpolate({ inputRange: [0, 0.55, 1], outputRange: [1, 0.55, 0.2] });
  const foldScaleX = fold.interpolate({ inputRange: [0, 0.55, 1], outputRange: [1, 0.92, 0.55] });
  const foldY = fold.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const foldOpacity = fold.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 0.7, 0] });
  const foldRotate = fold.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-8deg'] });

  if (folded) {
    return (
      <View style={styles.envelopeDone}>
        <View style={styles.envelopeBody}>
          <View style={styles.envelopeFlap} />
          <View style={styles.envelopeSeal}>
            <Text style={styles.envelopeSealText}>مُهر</Text>
          </View>
          <TypewriterText text="نامه ارسال شد ❤️" style={styles.sentTitle} cps={18} />
          <Text style={styles.sentSub}>پاکت بسته و مُهر خورد… منتظرش باش</Text>
          <Pressable onPress={handleOwnLink} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>نامهٔ دعوت خودت رو بنویس ✨</Text>
          </Pressable>
          <Pressable onPress={onReset} hitSlop={8}>
            <Text style={styles.reset}>از اول بنویس</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={{
        opacity: foldOpacity,
        transform: [
          { translateY: foldY },
          { scaleX: foldScaleX },
          { scaleY: foldScaleY },
          { rotate: foldRotate },
        ],
      }}
    >
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
              {done ? 'داره تا می‌شه…' : submitting ? 'داره مُهر می‌خوره...' : 'بزن بریم، ثبتش کن 💌'}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  confettiLayer: { ...StyleSheet.absoluteFillObject },
  confetti: { position: 'absolute', top: 8, fontSize: 16 },
  sealBig: {
    alignSelf: 'center',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.waxDeep,
    borderWidth: 3,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  sealBigText: {
    color: '#fff',
    fontWeight: weights.semibold,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  eyebrow: {
    fontFamily: fonts.body,
    color: colors.wax,
    fontSize: 12,
    fontWeight: weights.medium,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },
  message: {
    fontFamily: fonts.body,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
    fontWeight: weights.medium,
  },
  warm: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontSize: 13,
    fontWeight: weights.medium,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  footnote: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 12,
    fontWeight: weights.medium,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: colors.wax,
    borderRadius: radii.pill,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: weights.semibold,
    fontFamily: fonts.body,
  },
  secondaryBtn: {
    borderRadius: radii.pill,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.wax,
    marginBottom: spacing.sm,
    backgroundColor: '#FFF8FA',
  },
  secondaryText: {
    color: colors.waxDeep,
    fontSize: 14,
    fontWeight: weights.semibold,
    fontFamily: fonts.body,
  },
  btnDisabled: { opacity: 0.55 },
  hint: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 12,
    fontWeight: weights.medium,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  reset: {
    fontFamily: fonts.body,
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: weights.medium,
    textDecorationLine: 'underline',
  },
  envelopeDone: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  envelopeBody: {
    backgroundColor: colors.waxDeep,
    borderRadius: 18,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
    overflow: 'hidden',
  },
  envelopeFlap: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 36,
    backgroundColor: colors.wax,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    opacity: 0.85,
  },
  envelopeSeal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.wax,
    borderWidth: 3,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  envelopeSealText: {
    color: '#fff',
    fontFamily: fonts.body,
    fontWeight: weights.semibold,
    fontSize: 12,
  },
  sentTitle: {
    color: '#fff',
    fontFamily: fonts.body,
    fontSize: 22,
    fontWeight: weights.semibold,
    textAlign: 'center',
    writingDirection: 'rtl',
    minHeight: 32,
    marginBottom: spacing.sm,
  },
  sentSub: {
    color: 'rgba(255,247,249,0.82)',
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: weights.medium,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
});
