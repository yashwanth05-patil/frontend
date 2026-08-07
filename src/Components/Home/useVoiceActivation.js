import { useCallback, useEffect, useRef, useState } from 'react';

// Listens continuously for a wake phrase and fires onTrigger() when heard.
//
// Design notes (kept honest for a review-stage build, not oversold):
// - Uses the browser's built-in SpeechRecognition (webkitSpeechRecognition on
//   Chrome/Edge/Android). It is NOT available on every browser (notably
//   Firefox and some iOS Safari versions) - we detect that and expose
//   `isSupported` so the UI can say so instead of silently doing nothing.
// - This is cloud/browser speech recognition, not a fully offline on-device
//   wake-word model like Porcupine. That's a reasonable trade for a student
//   project, but it does mean it needs an active internet connection and
//   sends audio to the browser vendor's recognition service - worth saying
//   out loud to reviewers rather than glossing over.
// - Recognition sessions time out on their own after periods of silence in
//   most browsers, so we auto-restart it while the toggle is on.
const WAKE_PHRASES = ['help me', 'i need help', 'emergency', 'save me'];

export function useVoiceActivation(onTrigger) {
  const [isSupported] = useState(
    typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const [isListening, setIsListening] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const [micError, setMicError] = useState(null);

  const recognitionRef = useRef(null);
  const shouldRestartRef = useRef(false);
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

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

      setLastHeard(transcript);

      if (WAKE_PHRASES.some((phrase) => transcript.includes(phrase))) {
        onTriggerRef.current?.();
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicError('Microphone permission denied');
        shouldRestartRef.current = false;
        setIsListening(false);
      }
      // Other errors (e.g. 'no-speech', 'network') are transient - the
      // onend handler below restarts recognition automatically.
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        try {
          recognition.start();
        } catch {
          // Already-started errors can happen on rapid restart; ignore.
        }
      } else {
        setIsListening(false);
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
    } catch (err) {
      setMicError(err.message);
    }
  }, [isSupported, buildRecognizer]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  return { isSupported, isListening, lastHeard, micError, startListening, stopListening };
}
