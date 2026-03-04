let audioContext;
const SOUND_PREF_KEY = 'soundEnabled';

const TONE_PATTERNS = {
  notification: [784, 988],
  message: [880, 660],
  workout: [523, 659, 784],
  invite: [659, 784, 988]
};

export const isSoundEnabled = () => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(SOUND_PREF_KEY) !== 'false';
};

export const setSoundEnabled = (enabled) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_PREF_KEY, enabled ? 'true' : 'false');
};

export const playNotificationSound = async (type = 'notification') => {
  try {
    if (typeof window === 'undefined') return;
    if (!isSoundEnabled()) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContext) {
      audioContext = new AudioCtx();
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const frequencies = TONE_PATTERNS[type] || TONE_PATTERNS.notification;
    const startTime = audioContext.currentTime + 0.01;

    frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      const toneStart = startTime + index * 0.12;
      const toneEnd = toneStart + 0.1;

      gain.gain.setValueAtTime(0.0001, toneStart);
      gain.gain.exponentialRampToValueAtTime(0.1, toneStart + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, toneEnd);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start(toneStart);
      oscillator.stop(toneEnd);
    });
  } catch {
  }
};
