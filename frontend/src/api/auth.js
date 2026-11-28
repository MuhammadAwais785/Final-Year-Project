import { api } from './client';

export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const updateMe = (data) => api.patch('/auth/me', data);
export const changePassword = (data) => api.post('/auth/change-password', data);
export const deleteMe = (password) => api.delete('/auth/me', { data: { password } });
export const saveAccountPin = (data) => api.put('/auth/pin', data);
export const verifyAccountPin = (pin) => api.post('/auth/pin/verify', { pin });
