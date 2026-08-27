import { useCallback, useEffect, useRef, useState } from 'react';

// Two-stage, Google-Assistant-style voice activation:
//   Stage 1 (sleeping):  only listens for the wake word ("hey safe").
//                        Hearing it "arms" the app - like the screen
//                        lighting up after "Hey Google".
//   Stage 2 (armed):     for a short window after the wake word, listens
//                        for an actual command ("emergency", "help me",
//                        "need help"). Hearing one fires SOS. If nothing
//                        is said in time, it quietly goes back to sleep.
//
// Saying "emergency" out of nowhere, with no wake word first, does NOT
// trigger SOS - that's the point of the two stages, to avoid firing on a
// random overheard word.
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
const WAKE_PHRASES = ['hey safe', 'hey save', 'a safe']; // last 2 catch common mis-hears
const COMMAND_PHRASES = ['emergency', 'need help', 'help me', 'save me'];
const ARMED_WINDOW_MS = 8000;
const RESTART_DEBOUNCE_MS = 600;
const STORAGE_KEY = 'imsafe_voice_activation_enabled';

export function useVoiceActivation(onTrigger) {
  const [isSupported] = useState(
    typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const [isListening, setIsListening] = useState(false);
  const [stage, setStage] = useState('sleeping'); // 'sleeping' | 'armed'
  const [micError, setMicError] = useState(null);

  const recognitionRef = useRef(null);
  const shouldRestartRef = useRef(false);
  const restartTimeoutRef = useRef(null);
  const armedTimeoutRef = useRef(null);
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  const disarm = useCallback(() => {
    clearTimeout(armedTimeoutRef.current);
    setStage('sleeping');
  }, []);

  const arm = useCallback(() => {
    clearTimeout(armedTimeoutRef.current);
    armedTimeoutRef.current = setTimeout(() => disarm(), ARMED_WINDOW_MS);
  }, [disarm]);

  const buildRecognizer = useCallback(() => {
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .toLowerCase();

      setStage((currentStage) => {
        if (currentStage === 'sleeping') {
          if (WAKE_PHRASES.some((phrase) => transcript.includes(phrase))) {
            arm();
            return 'armed';
          }
          return currentStage;
        }

        // currentStage === 'armed'
        if (COMMAND_PHRASES.some((phrase) => transcript.includes(phrase))) {
          clearTimeout(armedTimeoutRef.current);
          onTriggerRef.current?.();
          return 'sleeping';
        }
        return currentStage;
      });
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
      }
    };

    return recognition;
  }, [arm]);

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
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (err) {
      setMicError(err.message);
    }
  }, [isSupported, buildRecognizer]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    clearTimeout(restartTimeoutRef.current);
    disarm();
    recognitionRef.current?.stop();
    setIsListening(false);
    localStorage.setItem(STORAGE_KEY, 'false');
  }, [disarm]);

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
      clearTimeout(armedTimeoutRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  return {
    isSupported,
    isListening,
    stage, // 'sleeping' or 'armed' - drives the UI indicator
    micError,
    startListening,
    stopListening,
    wasEnabledBefore: wasEnabledBefore.current,
  };
}
