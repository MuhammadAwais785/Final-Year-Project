/**
 * M04 — Speech AI: useSpeech hook
 *
 * React hook that manages the full speech recognition lifecycle:
 *   - Checks microphone availability
 *   - Starts / stops listening
 *   - Returns transcript, listening state, and clarity score
 *
 * Usage:
 *   const { listening, transcript, score, startListening, stopListening, reset } =
 *     useSpeech({ expectedWord, language });
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CLARITY_FEEDBACK, scoreClarity } from './ClarityScorer';
import SpeechEngine from './SpeechEngine';

const TIMEOUT_MS = 8000; // stop listening after 8 s if child says nothing

/**
 * @param {object} opts
 * @param {string} opts.expectedWord  - The word the child should say
 * @param {'en'|'ur'} opts.language   - Recognition locale
 * @param {function} [opts.onScore]   - Called with { score, label } when done
 */
export default function useSpeech({ expectedWord, language = 'en', onScore } = {}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null); // { score, label }
  const [error, setError] = useState(null);
  const [available, setAvailable] = useState(true);

  const timeoutRef = useRef(null);

  // Check on mount whether the device supports speech
  useEffect(() => {
    SpeechEngine.isAvailable().then(setAvailable);
  }, []);

  // Wire up SpeechEngine callbacks once
  useEffect(() => {
    SpeechEngine.setup({
      onStart: () => {
        setListening(true);
        setError(null);
        setTranscript('');
        setResult(null);
        // Auto-stop after timeout
        timeoutRef.current = setTimeout(() => {
          SpeechEngine.stop();
        }, TIMEOUT_MS);
      },
      onEnd: () => {
        setListening(false);
        clearTimeout(timeoutRef.current);
      },
      onResult: (text) => {
        setTranscript(text);
        const scored = scoreClarity(text, expectedWord);
        setResult(scored);
        onScore?.(scored);
        SpeechEngine.stop(); // got a result — stop immediately
      },
      onError: (msg) => {
        setListening(false);
        setError(msg);
        clearTimeout(timeoutRef.current);
      },
    });

    return () => {
      clearTimeout(timeoutRef.current);
      SpeechEngine.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedWord, language]);

  const startListening = useCallback(() => {
    if (!available) {
      setError('Microphone not available on this device.');
      return;
    }
    SpeechEngine.start(language);
  }, [available, language]);

  const stopListening = useCallback(() => {
    SpeechEngine.stop();
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setResult(null);
    setError(null);
    setListening(false);
  }, []);

  const feedback = result
    ? CLARITY_FEEDBACK[result.label]
    : null;

  return {
    listening,
    transcript,
    score: result?.score ?? null,
    scoreLabel: result?.label ?? null,
    feedback,         // { en, ur }
    error,
    available,
    startListening,
    stopListening,
    reset,
  };
}
