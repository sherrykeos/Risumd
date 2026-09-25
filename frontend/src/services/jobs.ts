import { fetchApi } from '@/lib/api-client';
import {
  Job,
  JobCreate,
  JobUpdate,
  JDAnalysis,
  JDAnalysisCreate,
  JDAnalysisUpdate,
  JobMatchResponse,
} from '@/types';

export const jobService = {
  getAll: () => fetchApi<Job[]>('/jobs'),
  getById: (id: number) => fetchApi<Job>(`/jobs/${id}`),
  create: (data: JobCreate) => fetchApi<Job>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: JobUpdate) => fetchApi<Job>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/jobs/${id}`, { method: 'DELETE' }),

  // JD Analysis
  getAnalysis: (jobId: number) => fetchApi<JDAnalysis>(`/jobs/${jobId}/analysis`),
  createAnalysis: (jobId: number, data: JDAnalysisCreate) => fetchApi<JDAnalysis>(`/jobs/${jobId}/analysis`, { method: 'POST', body: JSON.stringify(data) }),
  generateAnalysis: (jobId: number) => fetchApi<JDAnalysis>(`/jobs/${jobId}/analysis/generate`, { method: 'POST' }),
  updateAnalysis: (jobId: number, data: JDAnalysisUpdate) => fetchApi<JDAnalysis>(`/jobs/${jobId}/analysis`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAnalysis: (jobId: number) => fetchApi<void>(`/jobs/${jobId}/analysis`, { method: 'DELETE' }),

  // Matches
  getMatches: (jobId: number) => fetchApi<JobMatchResponse>(`/jobs/${jobId}/matches`),
};
