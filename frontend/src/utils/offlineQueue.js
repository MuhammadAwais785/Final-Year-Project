import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@silent_screen/offline_queue';
export async function enqueue(record) {
  const current = JSON.parse((await AsyncStorage.getItem(KEY)) || '[]');
  await AsyncStorage.setItem(KEY, JSON.stringify([...current, record]));
}
export async function getQueue() {
  return JSON.parse((await AsyncStorage.getItem(KEY)) || '[]');
}
export async function clearQueue() {
  await AsyncStorage.removeItem(KEY);
}
