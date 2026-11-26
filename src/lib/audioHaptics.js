let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, type, duration, gainLevel = 0.08, soundEnabled = true) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

export function triggerHaptic(vibrateEnabled = true) {
  if (vibrateEnabled && navigator.vibrate) {
    navigator.vibrate(35);
  }
}

export function playChime(type, soundEnabled = true, vibrateEnabled = true) {
  if (type === 'connect') {
    playTone(587.33, 'sine', 0.15, 0.08, soundEnabled);
    setTimeout(() => playTone(880.0, 'sine', 0.35, 0.06, soundEnabled), 120);
  } else if (type === 'message') {
    playTone(800, 'triangle', 0.08, 0.05, soundEnabled);
  } else if (type === 'disconnect') {
    playTone(400, 'sine', 0.12, 0.05, soundEnabled);
    setTimeout(() => playTone(280, 'sine', 0.2, 0.04, soundEnabled), 80);
  }
  triggerHaptic(vibrateEnabled);
}