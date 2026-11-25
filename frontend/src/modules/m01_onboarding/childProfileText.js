import { CHILD_AGE, CHILD_NAME_MAX_LENGTH } from '../../utils/constants';

/** Add-a-child wording in English and Urdu (UI-02, FR-1, UI-8), including the form's validation messages. */
export const CHILD_PROFILE_TEXT = {
  en: {
    title: 'Add a child',
    intro: 'New Profile Setup',
    name: "Child's name",
    namePlaceholder: 'e.g. Ali',
    age: 'Age',
    language: 'Language',
    save: 'Save profile',
    saving: 'Saving…',
    sessionEnded: 'Your session has ended. Please log in again.',
    saveFailed: 'Could not save the profile. Check your internet and try again.',
    errors: {
      nameRequired: "Please enter the child's name.",
      nameTooLong: `Use ${CHILD_NAME_MAX_LENGTH} characters or fewer.`,
      ageRange: `Choose an age from ${CHILD_AGE.MIN} to ${CHILD_AGE.MAX}.`,
      languageRequired: 'Choose English or Urdu.',
    },
  },
  ur: {
    title: 'بچہ شامل کریں',
    intro: 'پروفائل کا نیا اندراج',
    name: 'بچے کا نام',
    namePlaceholder: 'مثلاً علی',
    age: 'عمر (سال)',
    language: 'زبان',
    save: 'پروفائل محفوظ کریں',
    saving: 'محفوظ ہو رہا ہے…',
    sessionEnded: 'آپ کا سیشن ختم ہو گیا ہے۔ براہ کرم دوبارہ لاگ اِن کریں۔',
    saveFailed: 'پروفائل محفوظ نہیں ہو سکا۔ انٹرنیٹ کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
    errors: {
      nameRequired: 'براہ کرم بچے کا نام درج کریں۔',
      nameTooLong: `نام ${CHILD_NAME_MAX_LENGTH} حروف سے زیادہ نہ ہو۔`,
      ageRange: `${CHILD_AGE.MIN} سے ${CHILD_AGE.MAX} سال کے درمیان عمر منتخب کریں۔`,
      languageRequired: 'انگریزی یا اردو منتخب کریں۔',
    },
  },
};
