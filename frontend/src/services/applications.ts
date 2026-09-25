import { fetchApi } from '@/lib/api-client';
import { Application, ApplicationCreate, ApplicationUpdate } from '@/types';

export const applicationService = {
  getAll: () => fetchApi<Application[]>('/applications'),
  getById: (id: number) => fetchApi<Application>(`/applications/${id}`),
  create: (data: ApplicationCreate) => fetchApi<Application>('/applications', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: ApplicationUpdate) => fetchApi<Application>(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/applications/${id}`, { method: 'DELETE' }),
};
