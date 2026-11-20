import { api } from './client';

// Child profiles of the logged-in guardian (backend: routes/profileRoutes.js).
export const listProfiles = () => api.get('/profiles');
export const createProfile = (profile) => api.post('/profiles', profile);
