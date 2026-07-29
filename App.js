import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import BackgroundHearts from './components/BackgroundHearts';
import ProgressBar from './components/ProgressBar';
import IntroCard from './components/IntroCard';
import DatePickerCard from './components/DatePickerCard';
import OrderPickerCard from './components/OrderPickerCard';
import FinalCard from './components/FinalCard';
import { clearInvite, loadInvite, saveInvite } from './storage';
import { colors, spacing } from './theme';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function nowClock() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [finalClock, setFinalClock] = useState(null);
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const saved = await loadInvite();
      if (saved?.completed) {
        setSelectedDate(saved.selectedDate ?? null);
        setSelectedOrder(saved.selectedOrder ?? null);
        setFinalClock(saved.finalClock ?? nowClock());
        setStep(4);
      } else if (saved) {
        setSelectedDate(saved.selectedDate ?? null);
        setSelectedOrder(saved.selectedOrder ?? null);
        if (saved.selectedOrder) setStep(4);
        else if (saved.selectedDate) setStep(3);
        else setStep(1);
      }
      setReady(true);
    })();
  }, []);

  const animateTo = (nextStep) => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 12, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slide.setValue(-12);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const persist = async (partial) => {
    const payload = {
      selectedDate,
      selectedOrder,
      completed: false,
      finalClock,
      ...partial,
    };
    await saveInvite(payload);
  };

  const handleYes = () => animateTo(2);

  const handleDateNext = async (date) => {
    setSelectedDate(date);
    await persist({ selectedDate: date });
    animateTo(3);
  };

  const handleOrderConfirm = async (order) => {
    const clock = nowClock();
    setSelectedOrder(order);
    setFinalClock(clock);
    await saveInvite({
      selectedDate,
      selectedOrder: order,
      completed: true,
      completedAt: new Date().toISOString(),
      finalClock: clock,
    });
    animateTo(4);
  };

  const handleReset = async () => {
    await clearInvite();
    setSelectedDate(null);
    setSelectedOrder(null);
    setFinalClock(null);
    animateTo(1);
  };

  if (!ready) {
    return <LinearGradient colors={[colors.bgStart, colors.bgEnd]} style={styles.root} />;
  }

  return (
    <LinearGradient colors={[colors.bgStart, colors.bgEnd]} style={styles.root}>
      <BackgroundHearts />
      <View style={styles.frame}>
        <ProgressBar step={step} total={4} />
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          {step === 1 ? <IntroCard onYes={handleYes} /> : null}
          {step === 2 ? <DatePickerCard onNext={handleDateNext} /> : null}
          {step === 3 ? <OrderPickerCard onConfirm={handleOrderConfirm} /> : null}
          {step === 4 ? (
            <FinalCard
              selectedDate={selectedDate}
              selectedOrder={selectedOrder}
              finalClock={finalClock}
              onReset={handleReset}
            />
          ) : null}
        </Animated.View>
      </View>
      <StatusBar style="dark" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  frame: {
    width: '100%',
    maxWidth: 440,
  },
});
