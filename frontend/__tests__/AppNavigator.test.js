import React from 'react';
import { BackHandler } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { api } from '../src/api/client';

const act = ReactTestRenderer.act;

describe('AppNavigator integration flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders LoginScreen when unauthenticated and navigates to Home -> ChildHome with BackHandler locked', async () => {
    jest.spyOn(api, 'post').mockResolvedValue({
      data: { token: 'jwt-1', guardian: { id: 'g-1', name: 'Awais', email: 'a@b.com', language: 'en' } },
    });
    jest.spyOn(api, 'get').mockResolvedValue({
      data: [{ _id: 'c-1', id: 'c-1', name: 'Ali', age: 5, language: 'en' }],
    });

    const addBackSpy = jest.spyOn(BackHandler, 'addEventListener');

    let tree;
    await act(async () => {
      tree = ReactTestRenderer.create(<App />);
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'auth-email' })).toBeTruthy();

    await act(async () => {
      root.findByProps({ testID: 'auth-email' }).props.onChangeText('a@b.com');
      root.findByProps({ testID: 'auth-password' }).props.onChangeText('Password123!');
    });

    await act(async () => {
      await root.findByProps({ testID: 'auth-submit' }).props.onPress();
    });

    expect(root.findByProps({ testID: 'child-mode' })).toBeTruthy();
    expect(root.findByProps({ testID: 'parent-portal' })).toBeTruthy();

    await act(async () => {
      root.findByProps({ testID: 'child-mode' }).props.onPress();
    });

    expect(root.findByProps({ testID: 'game-object_naming' })).toBeTruthy();
    expect(addBackSpy).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    const backCb = addBackSpy.mock.calls[addBackSpy.mock.calls.length - 1][1];
    expect(backCb()).toBe(true);

    await act(async () => {
      tree.unmount();
    });
  });
});
