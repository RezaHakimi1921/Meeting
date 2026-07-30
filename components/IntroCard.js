import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';
import { bounce, tryVibrate } from '../utils/tapFeedback';
import LetterSheet from './LetterSheet';

export default function IntroCard({ onYes }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const yesScale = useRef(new Animated.Value(1)).current;
  const flap = useRef(new Animated.Value(0)).current;
  const [noPos, setNoPos] = useState({ top: 8, left: 12 });
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    Animated.timing(flap, { toValue: 1, duration: 900, useNativeDriver: true }).start(() =>
      setOpened(true)
    );
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [flap, pulse]);

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

  const flapRotate = flap.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-168deg'] });

  return (
    <View style={styles.envelope}>
      <Animated.View
        style={[
          styles.flap,
          {
            transform: [
              { perspective: 800 },
              { rotateX: flapRotate },
            ],
          },
        ]}
      />
      <LetterSheet stamp={'نامه\nخصوصی'}>
        <Text style={styles.eyebrow}>یک نامهٔ سربسته</Text>
        <Text style={styles.title}>با من میای سر قرار؟</Text>
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
              <Text style={styles.noText}>برمی‌گردونم</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  envelope: {
    width: '100%',
    maxWidth: 420,
  },
  flap: {
    height: 28,
    marginBottom: -10,
    marginHorizontal: 18,
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
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  title: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dimmed: {
    opacity: 0.55,
  },
  yesBtn: {
    backgroundColor: colors.wax,
    borderRadius: radii.pill,
    paddingVertical: 15,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  yesText: {
    fontFamily: fonts.body,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  noArena: {
    height: 84,
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
    fontWeight: '600',
  },
  sealRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  seal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.waxDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  sealText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.body,
  },
  hint: {
    flex: 1,
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
