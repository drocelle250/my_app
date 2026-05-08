import { useState, useRef, useCallback, useEffect } from "react";

/**
 * useVoiceSearch — Web Speech API hook
 *
 * Returns:
 *   listening   — bool, true while mic is active
 *   transcript  — last recognised text (resets on new session)
 *   error       — string | null
 *   supported   — bool, false on unsupported browsers
 *   start()     — begin listening
 *   stop()      — stop listening
 *   reset()     — clear transcript + error
 */
export default function useVoiceSearch({ onResult, lang = "en-US" } = {}) {
  const [listening,  setListening]  = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error,      setError]      = useState(null);
  const recognitionRef = useRef(null);
  // Always hold the latest onResult without causing stale closures
  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  // Check browser support once
  const SpeechRecognition =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = Boolean(SpeechRecognition);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      setError("Voice search is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (listening) return;

    setError(null);
    setTranscript("");

    const recognition = new SpeechRecognition();
    recognition.lang            = lang;
    recognition.interimResults  = true;
    recognition.maxAlternatives = 1;
    recognition.continuous      = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let interim = "";
      let final   = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      const text = (final || interim).trim();
      setTranscript(text);
      // Use ref to always call the latest onResult without stale closure
      if (final && onResultRef.current) onResultRef.current(final.trim());
    };

    recognition.onerror = (event) => {
      const msgs = {
        "not-allowed":    "Microphone access denied. Please allow mic access in your browser.",
        "no-speech":      "No speech detected. Please try again.",
        "network":        "Network error during voice recognition.",
        "audio-capture":  "No microphone found.",
        "aborted":        null,
      };
      const msg = msgs[event.error];
      if (msg !== null) setError(msg ?? `Voice error: ${event.error}`);
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [supported, listening, lang]); // ← removed onResult from deps, use ref instead

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return { listening, transcript, error, supported, start, stop, reset };
}
