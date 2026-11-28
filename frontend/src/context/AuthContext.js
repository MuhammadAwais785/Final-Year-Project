import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  deleteMe,
  getMe,
  login as loginRequest,
  register as registerRequest,
  updateMe,
} from '../api/auth';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import { listProfiles } from '../api/profiles';
import {
  clearAuthStorage,
  loadAuthSession,
  loadCachedProfiles,
  saveAuthSession,
  saveCachedProfiles,
} from '../modules/m01_onboarding/authStore';
import { clearLocalPin } from '../modules/m01_onboarding/pinStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [guardian, setGuardian] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [initializing, setInitializing] = useState(true);
  const tokenRef = useRef(null);

  const refreshProfiles = useCallback(async () => {
    const response = await listProfiles();
    const list = Array.isArray(response?.data) ? response.data : [];
    setProfiles(list);
    await saveCachedProfiles(list).catch(() => {});
    return list;
  }, []);

  const markPinConfigured = useCallback(() => {
    setGuardian((prev) => {
      if (!prev || prev.hasPin) return prev;
      const updated = { ...prev, hasPin: true };
      if (tokenRef.current) {
        saveAuthSession({ token: tokenRef.current, guardian: updated }).catch(() => {});
      }
      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    tokenRef.current = null;
    setAuthToken(null);
    setGuardian(null);
    setProfiles([]);
    clearAuthStorage().catch(() => {});
    clearLocalPin().catch(() => {});
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Restore saved session on app launch; keeps cached session if offline, logs out only on 401.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await loadAuthSession();
        if (!active || !saved) return;

        tokenRef.current = saved.token;
        setAuthToken(saved.token);
        setGuardian(saved.guardian);
        const cached = await loadCachedProfiles();
        if (active && cached.length > 0) setProfiles(cached);

        if (active) setInitializing(false);

        try {
          const meRes = await getMe();
          if (!active) return;
          if (meRes?.data?.guardian) {
            setGuardian(meRes.data.guardian);
            await saveAuthSession({ token: saved.token, guardian: meRes.data.guardian }).catch(() => {});
          }
          await refreshProfiles();
        } catch {
          // 401 is handled by the axios unauthorized interceptor; offline errors preserve cached session.
        }
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => { active = false; };
  }, [refreshProfiles]);

  const authenticate = useCallback(async (requestFn, data) => {
    const response = await requestFn(data);
    const { token, guardian: nextGuardian } = response.data;
    tokenRef.current = token;
    setAuthToken(token);
    setGuardian(nextGuardian);
    await saveAuthSession({ token, guardian: nextGuardian }).catch(() => {});
    try {
      await refreshProfiles();
    } catch {
      // Login succeeded even if profile prefetch failed; Parent Portal can retry.
    }
    return response.data;
  }, [refreshProfiles]);

  const login = useCallback((data) => authenticate(loginRequest, data), [authenticate]);
  const register = useCallback((data) => authenticate(registerRequest, data), [authenticate]);

  const updateProfile = useCallback(async (updates) => {
    const response = await updateMe(updates);
    const nextGuardian = response?.data?.guardian;
    if (nextGuardian) {
      setGuardian(nextGuardian);
      if (tokenRef.current) {
        await saveAuthSession({ token: tokenRef.current, guardian: nextGuardian }).catch(() => {});
      }
    }
    return nextGuardian;
  }, []);

  const deleteAccount = useCallback(async (password) => {
    await deleteMe(password);
    logout();
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        guardian,
        profiles,
        initializing,
        setProfiles,
        refreshProfiles,
        markPinConfigured,
        updateProfile,
        deleteAccount,
        login,
        register,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
