import { validateChildProfile } from '../src/modules/m01_onboarding/validateChildProfile';

// SRS Appendix B.1 test data (TD-01 to TD-06)
describe('validateChildProfile (FR-1)', () => {
  test('TD-01: Ali, 4, English is accepted', () => {
    expect(validateChildProfile({ name: 'Ali', age: 4, language: 'en' }))
      .toEqual({ ok: true, value: { name: 'Ali', age: 4, language: 'en' } });
  });

  test('TD-02: Sara, 5, Urdu is accepted', () => {
    expect(validateChildProfile({ name: 'Sara', age: 5, language: 'ur' }).ok).toBe(true);
  });

  test.each([
    ['TD-03: age 2', { name: 'Ahmed', age: 2, language: 'en' }, 'age'],
    ['TD-04: age 8', { name: 'Ayesha', age: 8, language: 'ur' }, 'age'],
    ['TD-05: no language', { name: 'Test Child', age: 6, language: null }, 'language'],
    ['TD-06: blank name', { name: '   ', age: 4, language: 'en' }, 'name'],
  ])('%s is rejected', (_, input, field) => {
    const result = validateChildProfile(input);
    expect(result.ok).toBe(false);
    expect(Object.keys(result.errors)).toEqual([field]);
  });

  test('accepts boundary ages 3 and 7, rejects fractional ages', () => {
    expect(validateChildProfile({ name: 'A', age: 3, language: 'en' }).ok).toBe(true);
    expect(validateChildProfile({ name: 'A', age: 7, language: 'en' }).ok).toBe(true);
    expect(validateChildProfile({ name: 'A', age: 4.5, language: 'en' }).ok).toBe(false);
  });

  test('trims the name and reports all invalid fields together', () => {
    expect(validateChildProfile({ name: '  Zara ', age: 5, language: 'ur' }).value.name).toBe('Zara');
    expect(Object.keys(validateChildProfile({ name: '', age: 9 }).errors)).toEqual(['name', 'age', 'language']);
  });
});
