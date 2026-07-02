import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionEvent {
  results: { transcript: string }[][];
  error: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}

const SPEECH_ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Pristup mikrofonu nije dopušten. Provjeri postavke preglednika.',
  'no-speech': 'Nismo čuli ništa. Pokušaj ponovno.',
  'audio-capture': 'Mikrofon nije dostupan.',
  network: 'Mrežna greška pri prepoznavanju govora.',
  aborted: 'Prepoznavanje govora je prekinuto.',
};

interface UseSpeechRecognitionOptions {
  onError?: (message: string) => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);

  const [isListening, setIsListening] = useState(false);
  const [supported] = useState(() => {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as WindowWithSpeech;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  });
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as WindowWithSpeech;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'hr-HR';

        recognition.onstart = () => {
          setIsListening(true);
          setTranscript('');
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const result = event.results[0][0].transcript;
          setTranscript(result);
        };

        recognition.onerror = (event: SpeechRecognitionEvent) => {
          console.error('Speech recognition error', event.error);
          const message =
            SPEECH_ERROR_MESSAGES[event.error] ??
            'Prepoznavanje govora nije uspjelo. Pokušaj ponovno.';
          onErrorRef.current?.(message);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('Failed to start speech recognition', e);
      onErrorRef.current?.('Nije moguće pokrenuti prepoznavanje govora.');
    }
  }, [supported]);

  const stopListening = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error('Failed to stop speech recognition', e);
    }
  }, [supported]);

  return {
    startListening,
    stopListening,
    isListening,
    supported,
    transcript,
  };
}
