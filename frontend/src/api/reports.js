import { api } from './client';

export const fetchReports = (childId) =>
  api.get('/reports', { params: childId ? { childId } : undefined });
