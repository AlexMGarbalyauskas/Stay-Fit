// This module provides utility functions for 
// managing and playing notification sounds in the application.
// It uses the Web Audio API to generate tones 
// for different types of notifications.

//used for playing notification sounds in the app,
//like workout reminders, messages, etc.


// We define different tone patterns for various notification types
let audioContext;
const SOUND_PREF_KEY = 'soundEnabled';


// Define frequency patterns for different notification types
const TONE_PATTERNS = {
  notification: [784, 988],
  message: [880, 660],
  workout: [523, 659, 784],
  invite: [659, 784, 988]
};



// Check if sound is enabled in user preferences
export const isSoundEnabled = () => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(SOUND_PREF_KEY) !== 'false';
};



// Enable or disable sound based on user preference
export const setSoundEnabled = (enabled) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_PREF_KEY, enabled ? 'true' : 'false');
};



// Play a notification sound based on the type of notification
export const playNotificationSound = async (type = 'notification') => {
  try {

    // Ensure we are in a browser environment and sound is enabled
    if (typeof window === 'undefined') return;
    if (!isSoundEnabled()) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    // Create or resume the audio context
    if (!audioContext) {
      audioContext = new AudioCtx();
    }

    // Some browsers require a user interaction 
    // to start the audio context
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }



    // Get the frequency pattern for the specified notification type
    const frequencies = TONE_PATTERNS[type] || TONE_PATTERNS.notification;
    const startTime = audioContext.currentTime + 0.01;



    // For each frequency in the pattern, 
    // create an oscillator and gain node
    frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      // Schedule the tone to play with a short attack and decay
      const toneStart = startTime + index * 0.12;
      const toneEnd = toneStart + 0.1;

      gain.gain.setValueAtTime(0.0001, toneStart);
      gain.gain.exponentialRampToValueAtTime(0.1, toneStart + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, toneEnd);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      // Start and stop the oscillator to play the tone
      oscillator.start(toneStart);
      oscillator.stop(toneEnd);
    });
  } catch {
  }
};
