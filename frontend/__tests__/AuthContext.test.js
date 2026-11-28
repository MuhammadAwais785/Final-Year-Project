import React from 'react';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer from 'react-test-renderer';
import { api } from '../src/api/client';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { AUTH_PROFILES_KEY, AUTH_SESSION_KEY } from '../src/modules/m01_onboarding/authStore';

const act = ReactTestRenderer.act;

function Probe() {
  const { guardian, profiles, initializing } = useAuth();
  return (
    <Text testID="probe">
      {JSON.stringify({ initializing, guardian: guardian?.email || null, profiles: profiles.length })}
    </Text>
  );
}

describe('AuthContext session persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('restores saved session offline when network refresh fails', async () => {
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === AUTH_SESSION_KEY) {
        return JSON.stringify({
          token: 'saved-jwt',
          guardian: { id: 'g-1', name: 'Awais', email: 'awais@example.com', language: 'en' },
        });
      }
      if (key === AUTH_PROFILES_KEY) {
        return JSON.stringify([{ _id: 'c-1', name: 'Ali', age: 5, language: 'en' }]);
      }
      return null;
    });
    jest.spyOn(api, 'get').mockRejectedValue(new Error('Network Error'));

    let tree;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <AuthProvider>
          <Probe />
        </AuthProvider>,
      );
    });

    const state = JSON.parse(tree.root.findByProps({ testID: 'probe' }).props.children);
    expect(state).toEqual({
      initializing: false,
      guardian: 'awais@example.com',
      profiles: 1,
    });
  });

  test('clears stored session when background /auth/me returns 401', async () => {
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === AUTH_SESSION_KEY) {
        return JSON.stringify({
          token: 'expired-jwt',
          guardian: { id: 'g-1', name: 'Awais', email: 'awais@example.com', language: 'en' },
        });
      }
      return null;
    });

    const authMock = {
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    };
    jest.spyOn(api, 'get').mockImplementation(async () => {
      const err = { response: { status: 401 } };
      // Simulate axios response interceptor behavior for 401 on the instance
      const handler = api.interceptors.response.handlers[0];
      return handler.rejected(err);
    });

    let tree;
    await act(async () => {
      tree = ReactTestRenderer.create(
        <AuthProvider>
          <Probe />
        </AuthProvider>,
      );
    });

    expect(authMock.logout).not.toHaveBeenCalled();
    const state = JSON.parse(tree.root.findByProps({ testID: 'probe' }).props.children);
    expect(state.guardian).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(AUTH_SESSION_KEY);
  });
});
