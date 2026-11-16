/**
 * M04 — Speech AI: Speech Engine
 *
 * Thin wrapper around @react-native-voice/voice.
 * All recognition happens on-device — no audio leaves the phone (BR-20, BR-25).
 *
 * Usage:
 *   SpeechEngine.start(locale)   → starts listening
 *   SpeechEngine.stop()          → stops listening
 *   SpeechEngine.destroy()       → clean up listeners (call in useEffect cleanup)
 *
 * Locale examples:
 *   'en-US'  English
 *   'ur-PK'  Urdu (Pakistani locale)
 */

import Voice from '@react-native-voice/voice';

// Map our internal language codes to BCP-47 locale tags
const LOCALES = {
  en: 'en-US',
  ur: 'ur-PK',
};

let _onResult = null;
let _onError = null;
let _onStart = null;
let _onEnd = null;

function setup({ onResult, onError, onStart, onEnd }) {
  _onResult = onResult;
  _onError = onError;
  _onStart = onStart;
  _onEnd = onEnd;

  Voice.onSpeechStart = () => _onStart?.();
  Voice.onSpeechEnd = () => _onEnd?.();
  Voice.onSpeechError = (e) => _onError?.(e?.error?.message || 'Speech error');
  Voice.onSpeechResults = (e) => {
    const results = e?.value ?? [];
    if (results.length > 0) _onResult?.(results[0]); // best result first
  };
  Voice.onSpeechPartialResults = (e) => {
    const partial = e?.value?.[0];
    if (partial) _onResult?.(partial);
  };
}

async function start(language = 'en') {
  try {
    await Voice.start(LOCALES[language] ?? LOCALES.en);
  } catch (err) {
    _onError?.(err?.message ?? 'Could not start microphone');
  }
}

async function stop() {
  try {
    await Voice.stop();
  } catch (_) {
    // ignore — might already be stopped
  }
}

async function destroy() {
  try {
    await Voice.destroy();
    Voice.onSpeechStart = null;
    Voice.onSpeechEnd = null;
    Voice.onSpeechError = null;
    Voice.onSpeechResults = null;
    Voice.onSpeechPartialResults = null;
  } catch (_) {
    // ignore
  }
}

async function isAvailable() {
  try {
    return !!(await Voice.isAvailable());
  } catch (_) {
    return false;
  }
}

const SpeechEngine = { setup, start, stop, destroy, isAvailable };
export default SpeechEngine;
