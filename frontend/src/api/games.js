import { api } from './client';

export const getGameActivities = () => api.get('/games/activities');
export const getGameContent = (params) => api.get('/games/content', { params });
export const getChildGameProgress = (childId) => api.get(`/games/progress/${childId}`);
export const getChildGameSessions = (childId, params) =>
  api.get(`/games/sessions/${childId}`, { params });
export const submitGameSession = (payload) => api.post('/games/sessions', payload);
