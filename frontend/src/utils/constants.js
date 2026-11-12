export const LANGUAGES = { ENGLISH: 'en', URDU: 'ur' };
export const CHILD_AGE = { MIN: 3, MAX: 7 }; // BR-1
export const CHILD_NAME_MAX_LENGTH = 30;
// Parent PIN (UC-23, BR-34): 4 digits; 5 wrong tries in a row lock it for 5 minutes (lock time: to confirm with supervisor).
export const PIN = { LENGTH: 4, MAX_ATTEMPTS: 5, LOCK_MS: 5 * 60 * 1000 };
export const MODULES = ['m01_onboarding', 'm02_avatar', 'm03_games', 'm04_speech_ai', 'm05_vision_ai', 'm06_difficulty', 'm07_intervention', 'm08_sync', 'm09_dashboard', 'm10_reports'];
