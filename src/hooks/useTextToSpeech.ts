import { useCallback, useEffect, useState } from 'react';

function cleanMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links, keep text
    .replace(/[*_#~>]/g, '') // Remove formatting characters
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  const speak = useCallback((text: string) => {
    if (!supported) return;

    // Stop any active speech first
    window.speechSynthesis.cancel();

    const cleanedText = cleanMarkdown(text);
    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = 'hr-HR';

    // Find Croatian voice if available
    const voices = window.speechSynthesis.getVoices();
    const hrVoice = voices.find((v) => v.lang.startsWith('hr'));
    if (hrVoice) {
      utterance.voice = hrVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      if (event.error !== 'interrupted') {
        setIsSpeaking(false);
      }
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [supported]);

  // Handle page unload or unmount to stop speech
  useEffect(() => {
    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  return {
    speak,
    stop,
    isSpeaking,
    supported,
  };
}
