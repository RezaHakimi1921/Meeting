import { Platform } from 'react-native';

let audioCtx = null;

function createCtx() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

/** Unlock / resume audio on a user gesture (call from first tap). */
export function unlockAudio() {
  try {
    const ctx = createCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Silent blip so some browsers fully unlock the graph.
    const buffer = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    // optional polish
  }
}

function withRunningCtx(playFn) {
  try {
    const ctx = createCtx();
    if (!ctx) return;
    const run = () => {
      try {
        playFn(ctx);
      } catch {
        // ignore
      }
    };
    if (ctx.state === 'suspended') {
      ctx.resume().then(run).catch(() => {});
    } else {
      run();
    }
  } catch {
    // ignore — sound is optional polish
  }
}

/** Soft paper-flip / page-turn click via Web Audio (no asset needed). */
export function playPaperFlip() {
  withRunningCtx((ctx) => {
    const now = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.14), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      const t = i / data.length;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 16) * (1 - t);
      data[i] = noise * 0.55;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1600;
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.15);
  });
}

/** Soft seal stamp thud. */
export function playSealStamp() {
  withRunningCtx((ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.2);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.32, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  });
}
