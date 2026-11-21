/**
 * M04 — Speech AI: public entry point
 *
 * Exports `speechRecognizer` — the single object all games import.
 * Right now it is backed by the mock (same contract, no real audio).
 *
 * When the on-device model is ready, swap this one import and nothing
 * else in the codebase changes (FR-11, FR-12).
 *
 * Contract:
 *   speechRecognizer.recognize({ acceptedAnswers, language, listenMs })
 *     → Promise<{ heard, confidence, score, status }>
 *
 *   speechRecognizer.cancel()   // resolves pending call with no_response
 *
 * Status values: 'recognized' | 'incorrect' | 'inconclusive' | 'no_response'
 * Score:         0–100  (≥ 60 = pass, threshold in constants.js)
 *
 * Privacy (BR-20, SEC-1): the mock never touches audio. The real engine
 * also runs fully on-device and never saves or uploads audio.
 */

export { speechRecognizer } from './mockRecognizer';
