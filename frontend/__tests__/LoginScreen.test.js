import React from 'react';
import { Text, TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { api } from '../src/api/client';
import { AuthProvider } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import LoginScreen from '../src/modules/m01_onboarding/LoginScreen';

const act = ReactTestRenderer.act;

async function renderLogin(props = {}) {
  let tree;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <AuthProvider>
        <LanguageProvider>
          <LoginScreen {...props} />
        </LanguageProvider>
      </AuthProvider>,
    );
  });
  const root = tree.root;
  const texts = () => root.findAllByType(Text).map((t) => [].concat(t.props.children).join(''));
  return { root, texts, unmount: () => act(async () => tree.unmount()) };
}

describe('LoginScreen (UI-8, DESIGN.md)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders English only by default and switches to Urdu only', async () => {
    const en = await renderLogin({ language: 'en' });
    expect(en.texts()).toContain('Silent Screen');
    expect(en.texts()).not.toContain('سائلنٹ اسکرین');
    await en.unmount();

    const ur = await renderLogin({ language: 'ur' });
    expect(ur.texts()).toContain('سائلنٹ اسکرین');
    expect(ur.texts()).not.toContain('Silent Screen');
    await ur.unmount();
  });

  test('shows inline validation errors without calling API on invalid login', async () => {
    const postSpy = jest.spyOn(api, 'post');
    const { root, texts, unmount } = await renderLogin();

    await act(async () => {
      root.findByProps({ testID: 'auth-submit' }).props.onPress();
    });

    expect(postSpy).not.toHaveBeenCalled();
    expect(texts()).toContain('Please enter a valid email address.');
    expect(texts()).toContain('Please enter your password.');
    await unmount();
  });

  test('supports Create account mode with name, confirm password, and API error banner', async () => {
    jest.spyOn(api, 'post').mockRejectedValue({ response: { status: 409 } });
    const { root, texts, unmount } = await renderLogin();

    await act(async () => {
      root.findByProps({ testID: 'option-register' }).props.onPress();
    });

    const inputs = root.findAllByType(TextInput);
    expect(inputs).toHaveLength(4);

    await act(async () => {
      root.findByProps({ testID: 'auth-name' }).props.onChangeText('Awais');
      root.findByProps({ testID: 'auth-email' }).props.onChangeText('awais@example.com');
      root.findByProps({ testID: 'auth-password' }).props.onChangeText('Password123!');
      root.findByProps({ testID: 'auth-confirm-password' }).props.onChangeText('Password123!');
    });

    await act(async () => {
      await root.findByProps({ testID: 'auth-submit' }).props.onPress();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Awais',
      email: 'awais@example.com',
      password: 'Password123!',
      language: 'en',
    });
    expect(texts()).toContain('An account with this email already exists.');
    await unmount();
  });
});
