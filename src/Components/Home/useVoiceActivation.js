import { useCallback, useEffect, useRef, useState } from 'react';

// Single-stage, direct voice activation:
//   Listening always: recognizing any of the SOS phrases below immediately
//   fires the trigger - no wake word needed.
//
// Honest platform limits (worth knowing, not hiding):
// - This only works while the browser tab is open (foreground or
//   backgrounded) - a fully closed tab/browser cannot be "woken" by voice,
//   unlike a real OS-level assistant. There's no web API that allows that.
// - Uses the browser's built-in SpeechRecognition, so it needs an internet
//   connection and only works on Chrome/Edge/Android - not Firefox or some
//   iOS Safari versions.
// - Chrome plays a short system beep every time recognition restarts. This
//   is a browser-level behavior we can't fully silence from JS, but we
//   restart far less often than a naive implementation (see debounce below)
//   so it happens noticeably less.
const SOS_PHRASES = ['emergency', 'help me', 'i need help', 'need help', 'save me'];
const COOLDOWN_MS = 5000; // stop interim+final events double-firing
const RESTART_DEBOUNCE_MS = 600;
const STORAGE_KEY = 'imsafe_voice_activation_enabled';

export function useVoiceActivation(onTrigger) {
  const [isSupported] = useState(
    typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const [isListening, setIsListening] = useState(false);
  const [stage, setStage] = useState('idle'); // 'idle' | 'listening'
  const [micError, setMicError] = useState(null);

  const recognitionRef = useRef(null);
  const shouldRestartRef = useRef(false);
  const restartTimeoutRef = useRef(null);
  const lastTriggerAtRef = useRef(0);
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  const buildRecognizer = useCallback(() => {
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      // Use the latest interim/final transcript for the fastest detection.
      const latest = event.results[event.results.length - 1]?.[0]?.transcript || '';
      const transcript = `${latest} ${Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(' ')}`.toLowerCase();

      if (!SOS_PHRASES.some((phrase) => transcript.includes(phrase))) {
        return;
      }

      // Cooldown prevents interim + final events for the same utterance from
      // firing the SOS more than once.
      const now = Date.now();
      if (now - lastTriggerAtRef.current < COOLDOWN_MS) {
        return;
      }
      lastTriggerAtRef.current = now;
      onTriggerRef.current?.();
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicError('Microphone permission denied');
        shouldRestartRef.current = false;
        setIsListening(false);
      }
      // Other errors (e.g. 'no-speech', 'network') are transient - onend
      // below restarts recognition automatically after a short debounce.
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        clearTimeout(restartTimeoutRef.current);
        // Debouncing the restart cuts down how often Chrome's start-beep
        // fires, compared to restarting instantly on every onend.
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
          } catch {
            // Ignore "already started" races on rapid re-trigger.
          }
        }, RESTART_DEBOUNCE_MS);
      } else {
        setIsListening(false);
        setStage('idle');
      }
    };

    return recognition;
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setMicError('Voice activation is not supported in this browser');
      return;
    }
    setMicError(null);
    shouldRestartRef.current = true;
    const recognition = buildRecognizer();
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      setStage('listening');
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (err) {
      setMicError(err.message);
    }
  }, [isSupported, buildRecognizer]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    clearTimeout(restartTimeoutRef.current);
    recognitionRef.current?.stop();
    setIsListening(false);
    setStage('idle');
    localStorage.setItem(STORAGE_KEY, 'false');
  }, []);

  // Remember the user's choice across visits/reloads, like a real
  // "always on" assistant setting - but still needs one fresh permission
  // grant per browser, since browsers never let a site skip that prompt.
  const wasEnabledBefore = useRef(
    typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true'
  );

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      clearTimeout(restartTimeoutRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  return {
    isSupported,
    isListening,
    stage, // 'idle' or 'listening' - drives the UI indicator
    micError,
    startListening,
    stopListening,
    wasEnabledBefore: wasEnabledBefore.current,
  };
}