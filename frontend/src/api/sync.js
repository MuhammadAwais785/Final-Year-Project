import { api } from './client';

export const syncData = (payload) => api.post('/sync', payload);
export const syncSessions = syncData;
