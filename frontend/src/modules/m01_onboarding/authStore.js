import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_SESSION_KEY = '@silent_screen/auth_session';
export const AUTH_PROFILES_KEY = '@silent_screen/auth_profiles';

async function readJson(key) {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loadAuthSession() {
  const session = await readJson(AUTH_SESSION_KEY);
  if (!session || typeof session.token !== 'string' || !session.guardian?.id) {
    return null;
  }
  return session;
}

export async function saveAuthSession({ token, guardian }) {
  if (!token || !guardian?.id) return;
  await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ token, guardian }));
}

export async function loadCachedProfiles() {
  const list = await readJson(AUTH_PROFILES_KEY);
  return Array.isArray(list) ? list : [];
}

export async function saveCachedProfiles(profiles) {
  await AsyncStorage.setItem(AUTH_PROFILES_KEY, JSON.stringify(Array.isArray(profiles) ? profiles : []));
}

export async function clearAuthStorage() {
  await Promise.all([
    AsyncStorage.removeItem(AUTH_SESSION_KEY),
    AsyncStorage.removeItem(AUTH_PROFILES_KEY),
  ]);
}
