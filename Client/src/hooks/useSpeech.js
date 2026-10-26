import { useCallback, useEffect, useRef, useState } from 'react';

/** Browser speech recognition (mic -> text) and speech synthesis (text -> voice). */
export function useSpeech({ onFinal, lang = 'en-US' } = {}) {
  const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const recRef = useRef(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.lang = lang;
    window.speechSynthesis.speak(u);
  }, [lang]);

  const stop = useCallback(() => recRef.current?.stop(), []);

  const start = useCallback(() => {
    if (!SR) return;
    window.speechSynthesis?.cancel();
    setError('');
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = '';
      let final = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) final = true;
      }
      setInterim(text);
      if (final && text.trim()) onFinalRef.current?.(text.trim());
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed') setError('Microphone access was blocked. Allow it in your browser settings.');
      else if (e.error === 'no-speech') setError("I didn't hear anything. Tap the mic and try again.");
      else if (e.error !== 'aborted') setError('Speech recognition stopped unexpectedly.');
    };
    rec.onend = () => { setListening(false); setInterim(''); };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [SR, lang]);

  useEffect(() => () => { recRef.current?.abort(); window.speechSynthesis?.cancel(); }, []);

  return { supported: Boolean(SR), listening, interim, error, start, stop, speak };
}
