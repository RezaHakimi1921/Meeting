import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, fonts, radii, spacing, weights } from '../theme';
import { bounce, tryVibrate } from '../utils/tapFeedback';
import { unlockAudio } from '../utils/sound';
import LetterSheet from './LetterSheet';
import TypewriterText from './TypewriterText';

export default function IntroCard({ onYes }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const yesScale = useRef(new Animated.Value(1)).current;
  const flap = useRef(new Animated.Value(0)).current;
  const letterOut = useRef(new Animated.Value(0)).current;
  const [noPos, setNoPos] = useState({ top: 8, left: 12 });
  const [opened, setOpened] = useState(false);
  const [showType, setShowType] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(180),
      Animated.timing(flap, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(letterOut, { toValue: 1, friction: 7, tension: 55, useNativeDriver: true }),
    ]).start(() => {
      setOpened(true);
      setShowType(true);
    });

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [flap, letterOut, pulse]);

  const flee = () => {
    setNoPos({
      top: 4 + Math.random() * 70,
      left: 4 + Math.random() * 62,
    });
  };

  const handleYes = () => {
    bounce(yesScale);
    tryVibrate();
    unlockAudio();
    onYes?.();
  };

  const flapRotate = flap.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-168deg'] });
  const letterY = letterOut.interpolate({ inputRange: [0, 1], outputRange: [28, 0] });
  const letterOpacity = letterOut.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.5, 1] });

  return (
    <View style={styles.envelope}>
      <Animated.View
        style={[
          styles.flap,
          {
            transform: [{ perspective: 800 }, { rotateX: flapRotate }],
          },
        ]}
      />
      <Animated.View style={{ opacity: letterOpacity, transform: [{ translateY: letterY }] }}>
        <LetterSheet stamp={'نامه\nخصوصی'} dropIn={false}>
          <Text style={styles.eyebrow}>یک نامهٔ سربسته</Text>
          {showType ? (
            <TypewriterText text="با من میای سر قرار؟" style={styles.title} cps={22} />
          ) : (
            <Text style={[styles.title, { opacity: 0 }]}>با من میای سر قرار؟</Text>
          )}
          <Text style={styles.subtitle}>
            این نامه فقط برای تو نوشته شده. جواب درست هم فقط یکیشه…
          </Text>

          <View style={[styles.actions, !opened && styles.dimmed]}>
            <Animated.View style={{ transform: [{ scale: Animated.multiply(pulse, yesScale) }] }}>
              <Pressable onPress={handleYes} style={styles.yesBtn}>
                <Text style={styles.yesText}>پاکت رو باز می‌کنم — آره 💌</Text>
              </Pressable>
            </Animated.View>

            <View style={styles.noArena}>
              <Pressable
                onPressIn={flee}
                onHoverIn={Platform.OS === 'web' ? flee : undefined}
                style={[styles.noBtn, { top: `${noPos.top}%`, left: `${noPos.left}%` }]}
              >
                <Text style={styles.noText}>فعلا نه</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sealRow}>
            <View style={styles.seal}>
              <Text style={styles.sealText}>مُهر</Text>
            </View>
            <Text style={styles.hint}>آره همون مُهر قرمزه… منتظرته</Text>
          </View>
        </LetterSheet>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  envelope: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  flap: {
    height: 26,
    marginBottom: -10,
    marginHorizontal: 22,
    backgroundColor: colors.waxDeep,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    opacity: 0.85,
    transformOrigin: 'top',
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
  title: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 26,
    fontWeight: weights.semibold,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
    lineHeight: 38,
    minHeight: 38,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontSize: 14,
    fontWeight: weights.medium,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dimmed: {
    opacity: 0.45,
  },
  yesBtn: {
    backgroundColor: colors.wax,
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  yesText: {
    fontFamily: fonts.body,
    color: '#fff',
    fontSize: 15,
    fontWeight: weights.semibold,
    textAlign: 'center',
  },
  noArena: {
    height: 78,
    position: 'relative',
    width: '100%',
  },
  noBtn: {
    position: 'absolute',
    backgroundColor: '#EFE4E8',
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#DCC8D0',
  },
  noText: {
    fontFamily: fonts.body,
    color: colors.noButton,
    fontSize: 13,
    fontWeight: weights.medium,
  },
  sealRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  seal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.waxDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  sealText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: weights.semibold,
    fontFamily: fonts.body,
  },
  hint: {
    flex: 1,
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 12,
    fontWeight: weights.medium,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
