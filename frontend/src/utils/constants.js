export const LANGUAGES = { ENGLISH: 'en', URDU: 'ur' };
export const CHILD_AGE = { MIN: 3, MAX: 7 }; // BR-1
export const CHILD_NAME_MAX_LENGTH = 30;
// Parent PIN (UC-23, BR-34): 4 digits; 5 wrong tries in a row lock it for 5 minutes (lock time: to confirm with supervisor).
export const PIN = { LENGTH: 4, MAX_ATTEMPTS: 5, LOCK_MS: 5 * 60 * 1000 };
export const MODULES = ['m01_onboarding', 'm02_avatar', 'm03_games', 'm04_speech_ai', 'm05_vision_ai', 'm06_difficulty', 'm07_intervention', 'm08_sync', 'm09_dashboard', 'm10_reports'];
// Speech game round (UC-5): ROUND_SIZE prompts per round (UC-5 assumption 1: 2-5 minutes; size to confirm with supervisor), hints after 2 fails in a row and up to 3 levels (BR-13),
// move on after 5 tries (UC-5 E2), stars 2 / 1 with a hint (BR-11, BR-13), listen 6s (FR-11), short easy round of 3 after a calming break (BR-28).
export const GAME = { ROUND_SIZE: 6, HINT_AFTER_FAILS: 2, MAX_HINT_LEVEL: 3, MAX_ATTEMPTS: 5, STARS_CORRECT: 2, STARS_WITH_HINT: 1, LISTEN_MS: 6000, EASY_ROUND_SIZE: 3 };
