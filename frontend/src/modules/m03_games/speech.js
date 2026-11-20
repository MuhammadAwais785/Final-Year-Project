// The only place the games get a recogniser from (FR-11, FR-12).
import { createMockRecognizer } from './mockRecognizer';

// TODO: swap to `export { speechRecognizer as recognizer } from '../m04_speech_ai';` when Abdullah's mock lands.
export const recognizer = createMockRecognizer();
