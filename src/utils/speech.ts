/**
 * Browser SpeechSynthesis Manager for VSB College AI Chatbot
 * Manages voice playback, state transitions, speech collision prevention, and controls.
 */

export interface SpeechCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onPause?: () => void;
  onResume?: () => void;
}

const VOICE_PREF_KEY = 'vsb_voice_enabled_pref';

let currentUtteranceId = 0;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let currentCallbacks: SpeechCallbacks | null = null;
let voiceEnabled = true;

// Load persisted voice preference
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(VOICE_PREF_KEY);
    if (saved !== null) {
      voiceEnabled = saved === 'true';
    }
  } catch (e) {
    console.warn('Could not read voice preference:', e);
  }
}

export function isVoiceEnabled(): boolean {
  return voiceEnabled;
}

export function setVoiceEnabled(enabled: boolean): void {
  voiceEnabled = enabled;
  try {
    localStorage.setItem(VOICE_PREF_KEY, String(enabled));
  } catch (e) {
    console.warn('Could not save voice preference:', e);
  }

  if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    stopSpeech();
  }
}

export function setMuted(muted: boolean): void {
  setVoiceEnabled(!muted);
}

export function isMuted(): boolean {
  return !voiceEnabled;
}

/**
 * Strips markdown symbols, asterisks, URLs, and code blocks for clean text-to-speech
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ') // remove code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/#+\s/g, '') // headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/[-*•]\s+/g, ', ') // list bullets into breath pauses
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{2,}/g, '. ') // double newlines into sentences
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Halts any ongoing speech immediately and clears listeners
 */
export function stopSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  currentUtteranceId++;
  const oldCb = currentCallbacks;
  currentCallbacks = null;
  activeUtterance = null;
  (window as any).__vsbActiveUtterance = null;

  try {
    window.speechSynthesis.cancel();
  } catch (e) {
    console.warn('Speech cancellation error:', e);
  }
}

export function pauseSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      currentCallbacks?.onPause?.();
    }
  } catch (e) {
    console.warn('Speech pause error:', e);
  }
}

export function resumeSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      currentCallbacks?.onResume?.();
    }
  } catch (e) {
    console.warn('Speech resume error:', e);
  }
}

export function isSpeechActive(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking && !window.speechSynthesis.paused;
}

export function isSpeechPaused(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.paused;
}

/**
 * Returns available voices, prioritizing natural English voices
 */
function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const preferredVoice =
    voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel') ||
          v.name.includes('Alex') ||
          v.name.includes('Karen'))
    ) ||
    voices.find((v) => v.lang.startsWith('en-US')) ||
    voices.find((v) => v.lang.startsWith('en-GB')) ||
    voices.find((v) => v.lang.startsWith('en'));

  return preferredVoice || voices[0] || null;
}

/**
 * Speaks text aloud using browser SpeechSynthesis with anti-collision & Chromium IPC buffer delay.
 */
export function speakText(text: string, callbacks?: SpeechCallbacks): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    callbacks?.onEnd?.();
    return;
  }

  if (!voiceEnabled) {
    callbacks?.onEnd?.();
    return;
  }

  const clean = cleanTextForSpeech(text);
  if (!clean) {
    callbacks?.onEnd?.();
    return;
  }

  // Cancel any prior speech first
  try {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {
    console.warn('Cancel error:', e);
  }

  const thisUtteranceId = ++currentUtteranceId;
  currentCallbacks = callbacks || null;

  // Chromium safeguard delay (60ms) prevents cancel() from discarding the new utterance
  setTimeout(() => {
    if (thisUtteranceId !== currentUtteranceId) return;

    try {
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.lang = 'en-US';

      const voice = getBestEnglishVoice();
      if (voice) {
        utterance.voice = voice;
      }

      activeUtterance = utterance;
      (window as any).__vsbActiveUtterance = utterance;

      let started = false;
      const triggerStart = () => {
        if (!started && thisUtteranceId === currentUtteranceId) {
          started = true;
          callbacks?.onStart?.();
        }
      };

      utterance.onstart = () => {
        triggerStart();
      };

      utterance.onend = () => {
        if (thisUtteranceId !== currentUtteranceId) return;
        activeUtterance = null;
        (window as any).__vsbActiveUtterance = null;
        callbacks?.onEnd?.();
      };

      utterance.onpause = () => {
        if (thisUtteranceId !== currentUtteranceId) return;
        callbacks?.onPause?.();
      };

      utterance.onresume = () => {
        if (thisUtteranceId !== currentUtteranceId) return;
        callbacks?.onResume?.();
      };

      utterance.onerror = (e) => {
        if (thisUtteranceId !== currentUtteranceId) return;
        activeUtterance = null;
        (window as any).__vsbActiveUtterance = null;
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('SpeechSynthesis error:', e.error);
          callbacks?.onError?.(e);
        }
        callbacks?.onEnd?.();
      };

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);

      // Fast-trigger start callback if Chrome buffers audio for >70ms
      setTimeout(() => {
        if (thisUtteranceId === currentUtteranceId && window.speechSynthesis.speaking) {
          triggerStart();
        }
      }, 70);

    } catch (err) {
      console.error('Failed to execute speakText:', err);
      activeUtterance = null;
      (window as any).__vsbActiveUtterance = null;
      callbacks?.onError?.(err);
      callbacks?.onEnd?.();
    }
  }, 60);
}
