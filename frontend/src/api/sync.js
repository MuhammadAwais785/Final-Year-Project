import { api } from './client';
export const syncSessions = (records) => api.post('/sync', { records });
