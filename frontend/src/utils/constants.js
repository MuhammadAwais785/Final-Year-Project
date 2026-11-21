export const LANGUAGES = { ENGLISH: 'en', URDU: 'ur' };
export const CHILD_AGE = { MIN: 3, MAX: 7 }; // BR-1
export const CHILD_NAME_MAX_LENGTH = 30;
// Parent PIN (UC-23, BR-34): 4 digits; 5 wrong tries in a row lock it for 5 minutes (lock time: to confirm with supervisor).
export const PIN = { LENGTH: 4, MAX_ATTEMPTS: 5, LOCK_MS: 5 * 60 * 1000 };
export const MODULES = ['m01_onboarding', 'm02_avatar', 'm03_games', 'm04_speech_ai', 'm05_vision_ai', 'm06_difficulty', 'm07_intervention', 'm08_sync', 'm09_dashboard', 'm10_reports'];
// One id per game and numeric levels, shared by games (M-03), difficulty (M-06) and the break (M-07). Import these; never type the strings.
export const ACTIVITIES = { OBJECT_NAMING: 'object_naming', COLOUR_MATCHING: 'colour_matching', SOUND_IMITATION: 'sound_imitation' };
export const LEVELS = [1, 2, 3];
// Speech game round (UC-5): ROUND_SIZE prompts per round (UC-5 assumption 1: 2-5 minutes; size to confirm with supervisor), hints after 2 fails in a row and up to 3 levels (BR-13),
// move on after 5 tries (UC-5 E2), stars 2 / 1 with a hint (BR-11, BR-13), listen 6s (FR-11), short easy round of 3 after a calming break (BR-28).
// DAILY_MILESTONE_STARS: still to be confirmed with the supervisor (FR-8).
export const GAME = { ROUND_SIZE: 6, HINT_AFTER_FAILS: 2, MAX_HINT_LEVEL: 3, MAX_ATTEMPTS: 5, STARS_CORRECT: 2, STARS_WITH_HINT: 1, LISTEN_MS: 6000, EASY_ROUND_SIZE: 3, DAILY_MILESTONE_STARS: 10 };
// Speech recogniser thresholds (M04, TBD-03). Values are starting points; supervisor to confirm.
// CONFIDENCE_MIN: below this → inconclusive (BR-22). SCORE_PASS: below this → incorrect (BR-23).
export const SPEECH = { LISTEN_MS: 6000, CONFIDENCE_MIN: 0.6, SCORE_PASS: 60 };
// Difficulty / level locking (M06, BR-14). PROMOTE_AFTER_CORRECT: correct-in-a-row before promoting.
export const DIFFICULTY = { PROMOTE_AFTER_CORRECT: 3 };
// Break trigger (M07, BR-27, TBD-04). WINDOW_MS: sustained-stress window. STRESS_THRESHOLD: 0–1.
// MIN_SAMPLES: minimum indicator snapshots in the window before we can trigger.
export const BREAK = { WINDOW_MS: 10000, STRESS_THRESHOLD: 0.65, MIN_SAMPLES: 3 };
// Goals (FR-3): at most MAX goals per child (BR-7). BR-8 is not described in DESIGN.md or next-tasks.md, so no rule is built on it yet.
// The word and minute ranges are our own guesses: to confirm with supervisor.
export const GOALS = { MAX: 5, WORDS_MIN: 1, WORDS_MAX: 50, MINUTES_MIN: 5, MINUTES_MAX: 30 };
// Sound Imitation scoring thresholds (M04, BR-16 "stricter matching at phoneme level").
// PHONEME_PASS: easiest level (child repeats a single sound, e.g. "aaa").
// SYLLABLE_PASS: mid level (e.g. "ap" from "apple").
// WORD_PASS: hardest level — same as SPEECH.SCORE_PASS (full word match).
// Fasih: BR-16 mein phoneme level 40 rakha hai (naram), word level 60 (strict). Supervisor se confirm karna hai.
export const IMITATION = { PHONEME_PASS: 40, SYLLABLE_PASS: 50, WORD_PASS: 60 };
