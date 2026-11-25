/**
 * Parent PIN wording in English and Urdu (UC-22, UC-23, UI-8). English mode shows each message in both
 * languages, as in the design; Urdu mode shows Urdu only. PIN digits stay Western in both (keypad is predictable).
 */
export const PIN_TEXT = {
  en: {
    create: 'Create a parent PIN',
    confirm: 'Enter the PIN again',
    verify: 'Enter Parent PIN',
    subtitle: 'To keep child play safe, enter your 4-digit security code.',
    mismatch: 'The PINs did not match. Please choose a PIN again.',
    wrong: (n) => `Incorrect PIN. ${n} attempts left.`,
    locked: (m) => `Too many tries. Try again in ${m} min.`,
    back: 'Back',
    forgot: 'Forgot PIN? Reset with email & password',
    delete: 'Delete',
    digitsEntered: (n, total) => `${n} of ${total} digits entered`,
  },
  ur: {
    create: 'والدین کا پن بنائیں',
    confirm: 'پن دوبارہ درج کریں',
    verify: 'والدین کا پن کوڈ درج کریں',
    subtitle: 'بچوں کے کھیل کو محفوظ رکھنے کے لیے اپنا 4 ہندسوں کا سیکیورٹی کوڈ درج کریں۔',
    mismatch: 'پن ایک جیسے نہیں تھے۔ دوبارہ پن بنائیں۔',
    wrong: (n) => `غلط پن۔ ${n} کوششیں باقی ہیں۔`,
    locked: (m) => `بہت زیادہ کوششیں۔ ${m} منٹ بعد دوبارہ کوشش کریں۔`,
    back: 'واپس',
    forgot: 'پن بھول گئے؟ ای میل اور پاس ورڈ سے ری سیٹ کریں',
    delete: 'مٹائیں',
    digitsEntered: (n, total) => `${total} میں سے ${n} ہندسے درج ہو چکے ہیں`,
  },
};
