import React, { useEffect } from 'react';
import { Linking, PermissionsAndroid, Platform, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import PrimaryButton from '../src/components/PrimaryButton';
import ToggleSwitch from '../src/components/ToggleSwitch';
import { ChildProfileProvider, useChildProfile } from '../src/context/ChildProfileContext';
import ConsentScreen, { MESSAGES } from '../src/modules/m01_onboarding/ConsentScreen';
import { loadConsent, saveConsent } from '../src/modules/m01_onboarding/consentStore';
import { requestCamera, requestMicrophone } from '../src/utils/permissions';

jest.mock('../src/utils/permissions', () => ({ requestMicrophone: jest.fn(), requestCamera: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => {
  let data = {};
  return {
    getItem: jest.fn(async (k) => (k in data ? data[k] : null)),
    setItem: jest.fn(async (k, v) => { data[k] = v; }),
    clear: async () => { data = {}; },
  };
});

const AsyncStorage = require('@react-native-async-storage/async-storage');

function SetChild() {
  const { setChild } = useChildProfile();
  useEffect(() => setChild({ _id: 'child-1', name: 'Ali' }), [setChild]);
  return null;
}

async function render(props = {}) {
  let tree;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<ChildProfileProvider><SetChild /><ConsentScreen {...props} /></ChildProfileProvider>);
  });
  const root = tree.root;
  const switchOf = (testID) => root.findAll((n) => n.type === ToggleSwitch && n.props.testID === testID)[0];
  const toggle = async (testID) => ReactTestRenderer.act(async () => {
    const sw = switchOf(testID);
    sw.props.onValueChange(!sw.props.value);
  });
  const isOn = (testID) => switchOf(testID).props.value;
  const save = async () => ReactTestRenderer.act(async () => root.findByType(PrimaryButton).props.onPress());
  const texts = () => root.findAllByType(Text).map((t) => [].concat(t.props.children).join(''));
  return { root, toggle, isOn, save, texts };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  requestMicrophone.mockResolvedValue('granted');
  requestCamera.mockResolvedValue('granted');
});
afterEach(() => jest.clearAllMocks());

describe('ConsentScreen (FR-10, FR-16, BR-24)', () => {
  test('microphone starts on and camera starts off', async () => {
    const { isOn } = await render();
    expect(isOn('consent-microphone')).toBe(true);
    expect(isOn('consent-camera')).toBe(false);
  });

  test('saves a versioned consent record for the active child and continues', async () => {
    const onSaved = jest.fn();
    const { save } = await render({ onSaved });
    await save();
    expect(requestMicrophone).toHaveBeenCalled();
    expect(requestCamera).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({
      childId: 'child-1', audioLocalAllowed: true, cameraAllowed: false, derivedSyncAllowed: false, version: 1,
    }));
  });

  test('turning the camera on asks for camera permission and saves it', async () => {
    const onSaved = jest.fn();
    const { toggle, save } = await render({ onSaved });
    await toggle('consent-camera');
    await save();
    expect(requestCamera).toHaveBeenCalled();
    expect(onSaved.mock.calls[0][0].cameraAllowed).toBe(true);
  });

  test('will not save with the microphone off (it is required)', async () => {
    const onSaved = jest.fn();
    const { toggle, save, texts } = await render({ onSaved });
    await toggle('consent-microphone');
    await save();
    expect(texts()).toContain(MESSAGES.micOff);
    expect(requestMicrophone).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  test('explains a denied microphone and does not save', async () => {
    requestMicrophone.mockResolvedValue('denied');
    const onSaved = jest.fn();
    const { save, texts } = await render({ onSaved });
    await save();
    expect(texts()).toContain(MESSAGES.micDenied);
    expect(onSaved).not.toHaveBeenCalled();
    expect(await loadConsent('child-1')).toBeNull();
  });

  test('a blocked microphone offers a button to open the phone Settings', async () => {
    requestMicrophone.mockResolvedValue('blocked');
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    const { root, save, texts } = await render();
    await save();
    expect(texts()).toContain(MESSAGES.micBlocked);
    await ReactTestRenderer.act(async () => root.findByProps({ testID: 'open-settings' }).props.onPress());
    expect(openSettings).toHaveBeenCalled();
  });

  test('a denied camera switches mood monitoring off and asks to save again', async () => {
    requestCamera.mockResolvedValue('denied');
    const onSaved = jest.fn();
    const { toggle, save, isOn, texts } = await render({ onSaved });
    await toggle('consent-camera');
    await save();
    expect(isOn('consent-camera')).toBe(false);
    expect(texts()).toContain(MESSAGES.cameraDenied);
    expect(onSaved).not.toHaveBeenCalled();
    await save();
    expect(onSaved.mock.calls[0][0].cameraAllowed).toBe(false);
  });

  test('opening the screen again shows the saved choices', async () => {
    await saveConsent('child-1', { audioLocalAllowed: true, cameraAllowed: true });
    const { isOn } = await render();
    expect(isOn('consent-camera')).toBe(true);
  });
});

describe('ToggleSwitch', () => {
  test('reports the opposite value and exposes its state to screen readers', () => {
    const onValueChange = jest.fn();
    let tree;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<ToggleSwitch label="Camera" value={false} onValueChange={onValueChange} />);
    });
    const button = tree.root.findByProps({ accessibilityRole: 'switch' });
    expect(button.props.accessibilityState).toEqual({ checked: false, disabled: false });
    ReactTestRenderer.act(() => button.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});

describe('consentStore', () => {
  test('each save raises the version and records the time', async () => {
    const first = await saveConsent('c9', { cameraAllowed: false }, () => 0);
    const second = await saveConsent('c9', { cameraAllowed: true }, () => 1000);
    expect([first.version, second.version]).toEqual([1, 2]);
    expect(second.updatedAt).toBe('1970-01-01T00:00:01.000Z');
    expect(await loadConsent('c9')).toEqual(second);
  });
});

describe('permissions', () => {
  const real = jest.requireActual('../src/utils/permissions');
  afterEach(() => jest.restoreAllMocks());

  test('maps Android results to granted / denied / blocked', async () => {
    Platform.OS = 'android';
    const ask = jest.spyOn(PermissionsAndroid, 'request');
    ask.mockResolvedValueOnce(PermissionsAndroid.RESULTS.GRANTED);
    expect(await real.requestMicrophone()).toBe('granted');
    ask.mockResolvedValueOnce(PermissionsAndroid.RESULTS.DENIED);
    expect(await real.requestMicrophone()).toBe('denied');
    ask.mockResolvedValueOnce(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);
    expect(await real.requestCamera()).toBe('blocked');
    expect(ask.mock.calls[0][0]).toBe(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    expect(ask.mock.calls[2][0]).toBe(PermissionsAndroid.PERMISSIONS.CAMERA);
  });
});
