import { CHILD_AGE, CHILD_NAME_MAX_LENGTH, LANGUAGES } from '../../utils/constants';
import { CHILD_PROFILE_TEXT } from './childProfileText';

/**
 * FR-1: validates the child profile form. Returns every invalid field so the
 * form can show an error under each one. Messages are in `language` ('en' or 'ur', UI-8).
 * @returns {{ ok: true, value: { name, age, language } } | { ok: false, errors: object }}
 */
export function validateChildProfile({ name = '', age, language }, messageLanguage = 'en') {
  const text = CHILD_PROFILE_TEXT[messageLanguage]?.errors || CHILD_PROFILE_TEXT.en.errors;
  const errors = {};
  const trimmed = name.trim();

  if (!trimmed) errors.name = text.nameRequired;
  else if (trimmed.length > CHILD_NAME_MAX_LENGTH) errors.name = text.nameTooLong;

  if (!Number.isInteger(age) || age < CHILD_AGE.MIN || age > CHILD_AGE.MAX) {
    errors.age = text.ageRange;
  }

  if (!Object.values(LANGUAGES).includes(language)) errors.language = text.languageRequired;

  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, value: { name: trimmed, age, language } };
}
