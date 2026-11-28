import { api } from './client';

// Child profiles of the logged-in guardian (backend: routes/profileRoutes.js).
export const listProfiles = () => api.get('/profiles');
export const createProfile = (profile) => api.post('/profiles', profile);
export const updateProfile = (id, updates) => api.patch(`/profiles/${id}`, updates);
export const deleteProfile = (id) => api.delete(`/profiles/${id}`);

export const getChildConsent = (id) => api.get(`/profiles/${id}/consent`);
export const saveChildConsent = (id, consent) => api.post(`/profiles/${id}/consent`, consent);

export const getChildGoals = (id) => api.get(`/profiles/${id}/goals`);
export const saveChildGoals = (id, goals) => api.put(`/profiles/${id}/goals`, { goals });

export const getChildBaselines = (id) => api.get(`/profiles/${id}/baselines`);
export const saveChildBaseline = (id, baseline) => api.post(`/profiles/${id}/baselines`, baseline);
