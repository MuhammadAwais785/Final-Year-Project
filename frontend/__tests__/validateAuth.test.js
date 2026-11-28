import { validateLogin, validateRegister } from '../src/modules/m01_onboarding/validateAuth';

describe('validateAuth', () => {
  test('normalizes email and validates login inputs', () => {
    const ok = validateLogin({ email: '  Awais@Example.COM ', password: 'secret' });
    expect(ok).toEqual({ ok: true, value: { email: 'awais@example.com', password: 'secret' } });

    const bad = validateLogin({ email: 'invalid', password: '' }, 'ur');
    expect(bad.ok).toBe(false);
    expect(bad.errors.email).toBeTruthy();
    expect(bad.errors.password).toBeTruthy();
  });

  test('validates name, email, password length, and matching confirmPassword on register', () => {
    const bad = validateRegister({
      name: '   ',
      email: 'bad@email',
      password: '123',
      confirmPassword: '456',
    });
    expect(bad.ok).toBe(false);
    expect(Object.keys(bad.errors).sort()).toEqual([
      'confirmPassword',
      'email',
      'name',
      'password',
    ]);

    const ok = validateRegister({
      name: '  Awais  ',
      email: 'Awais@Example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    expect(ok).toEqual({
      ok: true,
      value: { name: 'Awais', email: 'awais@example.com', password: 'Password123!' },
    });
  });
});
