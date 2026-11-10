import { CHILD_AGE, CHILD_NAME_MAX_LENGTH, LANGUAGES } from '../../utils/constants';

/**
 * FR-1: validates the child profile form. Returns every invalid field so the
 * form can show an error under each one.
 * @returns {{ ok: true, value: { name, age, language } } | { ok: false, errors: object }}
 */
export function validateChildProfile({ name = '', age, language }) {
  const errors = {};
  const trimmed = name.trim();

  if (!trimmed) errors.name = 'Please enter the child\'s name.';
  else if (trimmed.length > CHILD_NAME_MAX_LENGTH) errors.name = `Use ${CHILD_NAME_MAX_LENGTH} characters or fewer.`;

  if (!Number.isInteger(age) || age < CHILD_AGE.MIN || age > CHILD_AGE.MAX) {
    errors.age = `Choose an age from ${CHILD_AGE.MIN} to ${CHILD_AGE.MAX}.`;
  }

  if (!Object.values(LANGUAGES).includes(language)) errors.language = 'Choose English or Urdu.';

  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, value: { name: trimmed, age, language } };
}
