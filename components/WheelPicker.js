import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';
import { toFaDigits } from '../utils/jalali';

const ITEM_H = 36;
const VISIBLE = 3;

function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Compact iOS-like wheel for picking a value from a list.
 * Commits on every scroll tick so web/mouse-wheel still updates parent state
 * (RN Web often skips onMomentumScrollEnd).
 */
export default function WheelPicker({ values, value, onChange, format = (v) => String(v) }) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const valuesRef = useRef(values);
  const settleTimer = useRef(null);
  const index = Math.max(0, values.indexOf(value));

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  const commitFromY = (y, { snap } = { snap: false }) => {
    const vals = valuesRef.current;
    if (!vals?.length) return;
    const i = Math.min(vals.length - 1, Math.max(0, Math.round(y / ITEM_H)));
    const snapped = i * ITEM_H;
    if (snap) {
      listRef.current?.scrollTo({ y: snapped, animated: true });
      scrollY.setValue(snapped);
    }
    const next = vals[i];
    if (next !== valueRef.current) {
      valueRef.current = next;
      onChangeRef.current?.(next);
    }
  };

  useEffect(() => {
    const y = index * ITEM_H;
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ y, animated: false });
      scrollY.setValue(y);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    []
  );

  const handleScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    scrollY.setValue(y);
    commitFromY(y, { snap: false });
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => commitFromY(y, { snap: true }), 140);
  };

  const onMomentumEnd = (e) => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    commitFromY(e.nativeEvent.contentOffset.y, { snap: true });
  };

  return (
    <View
      style={styles.wrap}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
    >
      <View pointerEvents="none" style={styles.highlight} />
      <Animated.ScrollView
        ref={listRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        nestedScrollEnabled
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onMomentumEnd}
        contentContainerStyle={{ paddingVertical: ITEM_H }}
        style={styles.list}
      >
        {values.map((v, i) => (
          <WheelItem
            key={`${v}-${i}`}
            label={format(v)}
            index={i}
            scrollY={scrollY}
            onPress={() => {
              listRef.current?.scrollTo({ y: i * ITEM_H, animated: true });
              scrollY.setValue(i * ITEM_H);
              if (v !== valueRef.current) {
                valueRef.current = v;
                onChangeRef.current?.(v);
              }
            }}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

function WheelItem({ label, index, scrollY, onPress }) {
  const input = [(index - 1) * ITEM_H, index * ITEM_H, (index + 1) * ITEM_H];
  const opacity = scrollY.interpolate({
    inputRange: input,
    outputRange: [0.35, 1, 0.35],
    extrapolate: 'clamp',
  });
  const scale = scrollY.interpolate({
    inputRange: input,
    outputRange: [0.88, 1.06, 0.88],
    extrapolate: 'clamp',
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.Text style={[styles.item, { opacity, transform: [{ scale }] }]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

export function TimeWheel({ hour, minute, onHour, onMinute, hours, minutes }) {
  return (
    <View style={styles.timeRow}>
      <View style={styles.col}>
        <Text style={styles.colLabel}>ساعت</Text>
        <WheelPicker
          values={hours}
          value={hour}
          onChange={onHour}
          format={(v) => toFaDigits(pad2(v))}
        />
      </View>
      <Text style={styles.colon}>:</Text>
      <View style={styles.col}>
        <Text style={styles.colLabel}>دقیقه</Text>
        <WheelPicker
          values={minutes}
          value={minute}
          onChange={onMinute}
          format={(v) => toFaDigits(pad2(v))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: ITEM_H * VISIBLE,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#FFF9FC',
    borderWidth: 1,
    borderColor: colors.paperEdge,
  },
  list: {
    height: ITEM_H * VISIBLE,
  },
  highlight: {
    position: 'absolute',
    top: ITEM_H,
    left: 4,
    right: 4,
    height: ITEM_H,
    borderRadius: 10,
    backgroundColor: 'rgba(184,59,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(184,59,94,0.22)',
    zIndex: 1,
  },
  item: {
    height: ITEM_H,
    lineHeight: ITEM_H,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 17,
    fontWeight: Platform.OS === 'web' ? '500' : '600',
    color: colors.ink,
  },
  timeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  col: { width: 88 },
  colLabel: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  colon: {
    fontFamily: fonts.body,
    fontSize: 22,
    color: colors.wax,
    marginTop: 18,
    fontWeight: '500',
  },
});
