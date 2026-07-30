import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing, weights } from '../theme';
import { bounce, tryVibrate } from '../utils/tapFeedback';
import { playPaperFlip, unlockAudio } from '../utils/sound';
import LetterSheet from './LetterSheet';

const OPTIONS = [
  { id: 'pizza', emoji: '🍕', label: 'پیتزا' },
  { id: 'coffee', emoji: '☕', label: 'قهوه' },
  { id: 'kebab', emoji: '🍢', label: 'کوبیده' },
  { id: 'dessert', emoji: '🍒', label: 'دسر' },
];

function OrderOption({ opt, active, index, onSelect }) {
  const enter = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 110),
      Animated.spring(enter, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
    ]).start();
  }, [enter, index]);

  const pressIn = () => {
    Animated.spring(scale, { toValue: 1.06, friction: 5, tension: 140, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  };

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  return (
    <Animated.View
      style={[
        styles.optionWrap,
        {
          opacity: enter,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Pressable
        onPress={() => {
          bounce(scale);
          tryVibrate();
          onSelect(opt);
        }}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onHoverIn={Platform.OS === 'web' ? pressIn : undefined}
        onHoverOut={Platform.OS === 'web' ? pressOut : undefined}
        style={[styles.option, active && styles.optionActive]}
      >
        <Text style={styles.optionEmoji}>{opt.emoji}</Text>
        <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
          {active ? `✅ ${opt.label}` : opt.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function OrderPickerCard({ onConfirm }) {
  const [selected, setSelected] = useState(null);
  const btnScale = useRef(new Animated.Value(1)).current;
  const ink = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!selected) return;
    ink.setValue(0);
    Animated.timing(ink, { toValue: 1, duration: 380, useNativeDriver: true }).start();
  }, [selected, ink]);

  const handleConfirm = () => {
    if (!selected) return;
    bounce(btnScale);
    tryVibrate();
    unlockAudio();
    playPaperFlip();
    onConfirm?.(selected);
  };

  return (
    <LetterSheet stamp={'منو\nنامه'}>
      <Text style={styles.eyebrow}>یک خط از نامه…</Text>
      <Text style={styles.title}>چی سفارش می‌دی؟</Text>
      <Text style={styles.subtitle}>یه چیز خوشمزه بنویس تو نامه، مهمون منی</Text>

      <View style={styles.grid}>
        {OPTIONS.map((opt, i) => (
          <OrderOption
            key={opt.id}
            opt={opt}
            index={i}
            active={selected?.id === opt.id}
            onSelect={setSelected}
          />
        ))}
      </View>

      <Text style={styles.doodle}>✎ · · · · · · · · · · · · · ·</Text>

      {selected ? (
        <Animated.Text style={[styles.inkLine, { opacity: ink }]}>
          با خط خودم نوشتم: «{selected.label}»
        </Animated.Text>
      ) : (
        <View style={styles.inkPlaceholder} />
      )}

      <Animated.View style={{ transform: [{ scale: btnScale }] }}>
        <Pressable
          disabled={!selected}
          onPress={handleConfirm}
          style={[styles.cta, !selected && styles.ctaDisabled]}
        >
          <Text style={styles.ctaText}>مُهر بزن و بفرست 💌</Text>
        </Pressable>
      </Animated.View>
    </LetterSheet>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: fonts.body,
    color: colors.wax,
    fontSize: 12,
    fontWeight: weights.medium,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontSize: 22,
    fontWeight: weights.semibold,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontSize: 13,
    fontWeight: weights.medium,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  optionWrap: {
    width: '47%',
  },
  option: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.paperEdge,
    backgroundColor: '#FFFCFD',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  optionActive: {
    borderColor: colors.wax,
    backgroundColor: '#FFE9F1',
    shadowColor: colors.wax,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  optionEmoji: { fontSize: 26, marginBottom: 4 },
  optionLabel: {
    fontFamily: fonts.body,
    color: colors.ink,
    fontWeight: weights.medium,
    fontSize: 14,
  },
  optionLabelActive: { color: colors.waxDeep, fontWeight: weights.semibold },
  doodle: {
    textAlign: 'center',
    color: 'rgba(184,59,94,0.28)',
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  inkLine: {
    fontFamily: fonts.body,
    color: colors.wax,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
    fontSize: 13,
    fontWeight: weights.medium,
  },
  inkPlaceholder: { height: 22, marginBottom: spacing.md },
  cta: {
    backgroundColor: colors.wax,
    borderRadius: radii.pill,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: {
    fontFamily: fonts.body,
    color: '#fff',
    fontSize: 15,
    fontWeight: weights.semibold,
  },
});
