import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import PinScreen from '../src/modules/m01_onboarding/PinScreen';
import { PIN } from '../src/utils/constants';

const START = 1_000_000;
const mounted = [];
afterEach(() => ReactTestRenderer.act(() => mounted.splice(0).forEach((t) => t.unmount())));

/** In-memory stand-in for the real PIN store. */
function fakeStore({ pin = null, lock = null } = {}) {
  const data = { pin, lock };
  return {
    data,
    hasPin: jest.fn(async () => data.pin !== null),
    savePin: jest.fn(async (p) => { data.pin = p; }),
    checkPin: jest.fn(async (p) => p === data.pin),
    loadLockState: jest.fn(async () => data.lock),
    saveLockState: jest.fn(async (s) => { data.lock = s; }),
  };
}

async function render(store, props = {}) {
  let time = START;
  const now = () => time;
  let tree;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<PinScreen store={store} now={now} {...props} />);
  });
  mounted.push(tree);
  const root = tree.root;
  const type = async (digits) => {
    for (const d of digits) {
      await ReactTestRenderer.act(async () => root.findByProps({ testID: `pin-key-${d}` }).props.onPress());
    }
  };
  const texts = () => root.findAllByType(Text).map((t) => [].concat(t.props.children).join(''));
  return { root, type, texts, setTime: (t) => { time = t; } };
}

describe('PinScreen first visit: create a PIN (UC-22 alt. flow 1.1)', () => {
  test('asks to create, then confirm, then saves the PIN and unlocks', async () => {
    const store = fakeStore();
    const onUnlocked = jest.fn();
    const { type, texts } = await render(store, { onUnlocked });
    expect(texts()).toContain('Create a parent PIN');
    await type('1234');
    expect(texts()).toContain('Enter the PIN again');
    await type('1234');
    expect(store.savePin).toHaveBeenCalledWith('1234');
    expect(onUnlocked).toHaveBeenCalledTimes(1);
  });

  test('a different confirmation starts again and saves nothing', async () => {
    const store = fakeStore();
    const { type, texts } = await render(store);
    await type('1234');
    await type('9999');
    expect(texts()).toContain('⚠ The PINs did not match. Please choose a PIN again.');
    expect(texts()).toContain('Create a parent PIN');
    expect(store.savePin).not.toHaveBeenCalled();
  });

  test('does not offer "Forgot PIN" before a PIN exists', async () => {
    const { texts } = await render(fakeStore(), { onForgotPin: jest.fn() });
    expect(texts()).not.toContain('Forgot PIN? Reset with email & password');
  });
});

describe('PinScreen verify (UC-23, BR-34)', () => {
  test('the correct PIN unlocks and clears the wrong-PIN count', async () => {
    const store = fakeStore({ pin: '2468', lock: { failedAttempts: 2, lockedUntil: null } });
    const onUnlocked = jest.fn();
    const { type, texts } = await render(store, { onUnlocked });
    expect(texts()).toContain('Enter Parent PIN');
    await type('2468');
    expect(onUnlocked).toHaveBeenCalledTimes(1);
    expect(store.data.lock).toEqual({ failedAttempts: 0, lockedUntil: null });
  });

  test('a wrong PIN shows the attempts left in English and Urdu and clears the dots', async () => {
    const store = fakeStore({ pin: '2468' });
    const { type, texts, root } = await render(store);
    await type('1111');
    expect(texts()).toContain('⚠ Incorrect PIN. 4 attempts left.');
    expect(texts()).toContain('غلط پن۔ 4 کوششیں باقی ہیں۔');
    expect(root.findByProps({ accessibilityLabel: `0 of ${PIN.LENGTH} digits entered` })).toBeDefined();
  });

  test('5 wrong PINs lock the keypad, even for the right PIN, until the lock ends', async () => {
    const store = fakeStore({ pin: '2468' });
    const onUnlocked = jest.fn();
    const { type, texts, root, setTime } = await render(store, { onUnlocked });
    for (let i = 0; i < PIN.MAX_ATTEMPTS; i++) await type('1111');
    expect(texts()).toContain('⚠ Too many tries. Try again in 5 min.');
    expect(root.findByProps({ testID: 'pin-key-2' }).props.disabled).toBe(true);
    await type('2468');
    expect(onUnlocked).not.toHaveBeenCalled();
    expect(store.data.lock.lockedUntil).toBe(START + PIN.LOCK_MS);

    setTime(START + PIN.LOCK_MS);
    await ReactTestRenderer.act(async () => new Promise((r) => setTimeout(r, 1100)));
    expect(root.findByProps({ testID: 'pin-key-2' }).props.disabled).toBe(false);
    await type('2468');
    expect(onUnlocked).toHaveBeenCalledTimes(1);
  });

  test('stays locked after the app is reopened (lock state is loaded from the store)', async () => {
    const store = fakeStore({ pin: '2468', lock: { failedAttempts: 0, lockedUntil: START + 60_000 } });
    const { texts, root } = await render(store);
    expect(texts()).toContain('⚠ Too many tries. Try again in 1 min.');
    expect(root.findByProps({ testID: 'pin-key-5' }).props.disabled).toBe(true);
  });

  test('Delete removes the last digit', async () => {
    const store = fakeStore({ pin: '2468' });
    const { type, root } = await render(store);
    await type('24');
    await ReactTestRenderer.act(async () => root.findByProps({ testID: 'pin-key-delete' }).props.onPress());
    expect(root.findByProps({ accessibilityLabel: `1 of ${PIN.LENGTH} digits entered` })).toBeDefined();
    expect(store.checkPin).not.toHaveBeenCalled();
  });

  test('Forgot PIN and Back call their handlers', async () => {
    const onForgotPin = jest.fn();
    const onBack = jest.fn();
    const { root } = await render(fakeStore({ pin: '2468' }), { onForgotPin, onBack });
    ReactTestRenderer.act(() => root.findByProps({ accessibilityRole: 'link' }).props.onPress());
    ReactTestRenderer.act(() => root.findByProps({ accessibilityLabel: 'Back' }).props.onPress());
    expect(onForgotPin).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
  });
});
