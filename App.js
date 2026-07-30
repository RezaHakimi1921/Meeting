import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import BackgroundHearts from './components/BackgroundHearts';
import ProgressBar from './components/ProgressBar';
import StepHeader from './components/StepHeader';
import StartGateCard from './components/StartGateCard';
import IntroCard from './components/IntroCard';
import DateTimePickerCard from './components/DateTimePickerCard';
import OrderPickerCard from './components/OrderPickerCard';
import FinalCard from './components/FinalCard';
import WebFonts from './components/WebFonts';
import { clearInvite, loadInvite, saveInvite } from './storage';
import {
  fetchInvite,
  getInviteIdFromLocation,
  notifyInviteAccepted,
} from './utils/notify';
import { colors, spacing } from './theme';

const TOTAL_STEPS = 4;

export default function App() {
  const [ready, setReady] = useState(false);
  const [inviteId, setInviteId] = useState(null);
  const [inviteError, setInviteError] = useState(null);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const id = getInviteIdFromLocation();
      if (!id) {
        setInviteError('missing');
        setReady(true);
        return;
      }
      const meta = await fetchInvite(id);
      if (!meta.ok) {
        setInviteError(meta.error === 'invite_burned' ? 'burned' : 'invalid');
        setReady(true);
        return;
      }
      setInviteId(id);

      const saved = await loadInvite(id);
      if (saved?.completed) {
        setSelectedDate(saved.selectedDate ?? null);
        setSelectedTime(saved.selectedTime ?? null);
        setSelectedOrder(saved.selectedOrder ?? null);
        setSubmitted(Boolean(saved.notified));
        setStep(4);
      } else if (saved) {
        setSelectedDate(saved.selectedDate ?? null);
        setSelectedTime(saved.selectedTime ?? null);
        setSelectedOrder(saved.selectedOrder ?? null);
        setSubmitted(Boolean(saved.notified));
        if (saved.selectedOrder) setStep(4);
        else if (saved.selectedDate && saved.selectedTime) setStep(3);
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
    if (!inviteId) return;
    const payload = {
      selectedDate,
      selectedTime,
      selectedOrder,
      completed: false,
      notified: submitted,
      ...partial,
    };
    await saveInvite(inviteId, payload);
  };

  const handleBack = () => {
    if (step <= 1) return;
    animateTo(step - 1);
  };

  const handleYes = () => animateTo(2);

  const handleDateTimeNext = async ({ date, time }) => {
    setSelectedDate(date);
    setSelectedTime(time);
    await persist({ selectedDate: date, selectedTime: time });
    animateTo(3);
  };

  const handleOrderConfirm = async (order) => {
    setSelectedOrder(order);
    await saveInvite(inviteId, {
      selectedDate,
      selectedTime,
      selectedOrder: order,
      completed: true,
      completedAt: new Date().toISOString(),
      notified: false,
    });
    animateTo(4);
  };

  const handleSubmit = async () => {
    if (!inviteId || submitted || submitting) return false;
    setSubmitting(true);
    const ok = await notifyInviteAccepted({
      inviteId,
      date: selectedDate,
      time: selectedTime,
      order: selectedOrder,
    });
    setSubmitting(false);
    if (ok) {
      setSubmitted(true);
      await saveInvite(inviteId, {
        selectedDate,
        selectedTime,
        selectedOrder,
        completed: true,
        notified: true,
        completedAt: new Date().toISOString(),
      });
    }
    return ok;
  };

  const handleReset = async () => {
    await clearInvite(inviteId);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedOrder(null);
    setSubmitted(false);
    animateTo(1);
  };

  if (!ready) {
    return (
      <LinearGradient colors={[colors.bgStart, colors.bgEnd]} style={styles.root}>
        <WebFonts />
        <StatusBar style="light" />
      </LinearGradient>
    );
  }

  if (inviteError) {
    return (
      <LinearGradient colors={[colors.bgStart, colors.bgEnd]} style={styles.root}>
        <WebFonts />
        <BackgroundHearts />
        <View style={styles.frame}>
          <StartGateCard
            reason={
              inviteError === 'burned'
                ? 'burned'
                : inviteError === 'invalid'
                  ? 'invalid'
                  : 'missing'
            }
          />
        </View>
        <StatusBar style="light" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.bgStart, colors.bgEnd]} style={styles.root}>
      <WebFonts />
      <BackgroundHearts />
      <View style={styles.frame}>
        <StepHeader step={step} total={TOTAL_STEPS} onBack={handleBack} />
        <ProgressBar step={step} total={TOTAL_STEPS} />
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          {step === 1 ? <IntroCard onYes={handleYes} /> : null}
          {step === 2 ? (
            <DateTimePickerCard
              onNext={handleDateTimeNext}
              initialDate={selectedDate}
              initialTime={selectedTime}
            />
          ) : null}
          {step === 3 ? <OrderPickerCard onConfirm={handleOrderConfirm} /> : null}
          {step === 4 ? (
            <FinalCard
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedOrder={selectedOrder}
              submitted={submitted}
              submitting={submitting}
              onSubmit={handleSubmit}
              onReset={handleReset}
            />
          ) : null}
        </Animated.View>
      </View>
      <StatusBar style="light" />
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
