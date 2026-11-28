import React from 'react';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer from 'react-test-renderer';
import { LanguageProvider } from '../src/context/LanguageContext';
import { createAccountPinStore } from '../src/modules/m01_onboarding/pinStore';
import ResetPinScreen from '../src/modules/m01_onboarding/ResetPinScreen';

const act = ReactTestRenderer.act;

describe('Account PIN sync & ResetPinScreen (BR-34)', () => {
  const storage = {};

  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    AsyncStorage.getItem.mockImplementation(async (k) => (k in storage ? storage[k] : null));
    AsyncStorage.setItem.mockImplementation(async (k, v) => { storage[k] = v; });
    AsyncStorage.removeItem.mockImplementation(async (k) => { delete storage[k]; });
  });

  test('verifies against remote account PIN on a fresh device and caches salted hash locally', async () => {
    const verifyRemotePin = jest.fn(async (pin) => ({ data: { valid: pin === '2468' } }));
    const store = createAccountPinStore({ hasAccountPin: true, verifyRemotePin });

    expect(await store.hasPin()).toBe(true);
    expect(await store.checkPin('2468')).toBe(true);
    expect(verifyRemotePin).toHaveBeenCalledTimes(1);

    // Second check uses local PBKDF2 hash offline without calling the server again
    expect(await store.checkPin('2468')).toBe(true);
    expect(verifyRemotePin).toHaveBeenCalledTimes(1);
  });

  test('savePin keeps working offline if server sync fails', async () => {
    const saveRemotePin = jest.fn().mockRejectedValue(new Error('Network Error'));
    const store = createAccountPinStore({ saveRemotePin });

    await store.savePin('1357');
    expect(await store.checkPin('1357')).toBe(true);
  });

  test('ResetPinScreen validates inputs, shows 401 password error, and resets PIN on success', async () => {
    const resetWithPassword = jest
      .fn()
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce(undefined);
    const onResetSuccess = jest.fn();

    let tree;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <LanguageProvider>
          <ResetPinScreen store={{ resetWithPassword }} onResetSuccess={onResetSuccess} />
        </LanguageProvider>,
      );
    });

    const root = tree.root;
    const texts = () => root.findAllByType(Text).map((t) => [].concat(t.props.children).join(''));

    await act(async () => {
      root.findByProps({ testID: 'reset-pin-submit' }).props.onPress();
    });
    expect(resetWithPassword).not.toHaveBeenCalled();
    expect(texts()).toContain('Please enter your account password.');

    await act(async () => {
      root.findByProps({ testID: 'reset-password' }).props.onChangeText('WrongPass!');
      root.findByProps({ testID: 'reset-new-pin' }).props.onChangeText('9999');
      root.findByProps({ testID: 'reset-confirm-pin' }).props.onChangeText('9999');
    });
    await act(async () => {
      await root.findByProps({ testID: 'reset-pin-submit' }).props.onPress();
    });
    expect(texts()).toContain('Incorrect account password.');

    await act(async () => {
      root.findByProps({ testID: 'reset-password' }).props.onChangeText('Password123!');
    });
    await act(async () => {
      await root.findByProps({ testID: 'reset-pin-submit' }).props.onPress();
    });
    expect(resetWithPassword).toHaveBeenLastCalledWith({ password: 'Password123!', newPin: '9999' });
    expect(onResetSuccess).toHaveBeenCalledTimes(1);
  });
});
