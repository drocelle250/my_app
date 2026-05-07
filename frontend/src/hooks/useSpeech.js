/**
 * useSpeech — Web Speech Synthesis API hook
 * Allows the app to speak text aloud to the user.
 */
import { useCallback, useRef, useState } from "react";

export default function useSpeech({ lang = "en-US", rate = 0.95, pitch = 1 } = {}) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Speak a text string
  const speak = useCallback((text) => {
    if (!supported || !text) return;

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = lang;
    utterance.rate  = rate;
    utterance.pitch = pitch;

    // Pick a natural-sounding voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith(lang.split("-")[0]) && !v.name.includes("Google")
    ) || voices.find((v) => v.lang.startsWith(lang.split("-")[0])) || voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend   = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [supported, lang, rate, pitch]);

  // Stop speaking
  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { speak, stop, speaking, supported };
}
