import axios from 'axios';

// Android emulator reaches the host computer through 10.0.2.2.
export const API_URL = 'http://10.0.2.2:5000/api';
export const api = axios.create({ baseURL: API_URL, timeout: 10000 });

export function setAuthToken(token) {
  api.defaults.headers.common.Authorization = token ? `Bearer ${token}` : '';
}
