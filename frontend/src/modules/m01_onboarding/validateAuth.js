import { AUTH_LIMITS, AUTH_TEXT } from './authText';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorCopy(language) {
  return AUTH_TEXT[language]?.errors || AUTH_TEXT.en.errors;
}

function normalizedEmail(raw) {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

/**
 * Validates guardian login inputs (pure, UI-8 bilingual messages).
 */
export function validateLogin({ email = '', password = '' }, language = 'en') {
  const t = errorCopy(language);
  const errors = {};
  const cleanEmail = normalizedEmail(email);
  const pass = typeof password === 'string' ? password : '';

  if (!cleanEmail || cleanEmail.length > 254 || !EMAIL_RE.test(cleanEmail)) {
    errors.email = t.emailInvalid;
  }
  if (!pass) {
    errors.password = t.passwordRequired;
  }

  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, value: { email: cleanEmail, password: pass } };
}

/**
 * Validates guardian registration inputs (pure, UI-8 bilingual messages).
 */
export function validateRegister(
  { name = '', email = '', password = '', confirmPassword = '' },
  language = 'en',
) {
  const t = errorCopy(language);
  const errors = {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = normalizedEmail(email);
  const pass = typeof password === 'string' ? password : '';
  const confirm = typeof confirmPassword === 'string' ? confirmPassword : '';

  if (!cleanName) errors.name = t.nameRequired;
  else if (cleanName.length > AUTH_LIMITS.NAME_MAX_LENGTH) errors.name = t.nameTooLong;

  if (!cleanEmail || cleanEmail.length > 254 || !EMAIL_RE.test(cleanEmail)) {
    errors.email = t.emailInvalid;
  }

  if (pass.length < AUTH_LIMITS.PASSWORD_MIN_LENGTH) {
    errors.password = t.passwordShort;
  } else if (pass.length > AUTH_LIMITS.PASSWORD_MAX_LENGTH) {
    errors.password = t.passwordTooLong;
  }

  if (confirm !== pass) {
    errors.confirmPassword = t.passwordMismatch;
  }

  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, value: { name: cleanName, email: cleanEmail, password: pass } };
}
