import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Asks the phone for microphone / camera permission (HI-1, HI-2).
 * Returns 'granted', 'denied' (can ask again) or 'blocked' (only phone Settings can change it).
 * On iOS the system asks the first time the mic or camera is used, so this returns 'granted'.
 */
const RATIONALE = {
  microphone: {
    title: 'Microphone',
    message: "The speech games listen to your child's words. Voice is processed only on this phone and never uploaded.",
  },
  camera: {
    title: 'Camera',
    message: 'Mood monitoring uses the front camera. Images are processed only on this phone and never saved or uploaded.',
  },
};

async function request(permission, rationale) {
  if (Platform.OS !== 'android') return 'granted';
  const result = await PermissionsAndroid.request(permission, { ...rationale, buttonPositive: 'OK' });
  if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'blocked';
  return 'denied';
}

export const requestMicrophone = () => request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, RATIONALE.microphone);
export const requestCamera = () => request(PermissionsAndroid.PERMISSIONS.CAMERA, RATIONALE.camera);
