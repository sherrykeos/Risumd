import { fetchApi } from '@/lib/api-client';
import { ResumeVersion, ResumeGenerateRequest } from '@/types';

export const resumeService = {
  getAll: (jobId?: number) => {
    const params = jobId ? `?job_id=${jobId}` : '';
    return fetchApi<ResumeVersion[]>(`/resumes${params}`);
  },
  getForJob: (jobId: number) => fetchApi<ResumeVersion[]>(`/jobs/${jobId}/resumes`),
  getById: (id: number) => fetchApi<ResumeVersion>(`/resumes/${id}`),
  generate: (jobId: number, overrides?: ResumeGenerateRequest, skipAi: boolean = false) => {
    const query = skipAi ? '?skip_ai=true' : '';
    return fetchApi<ResumeVersion>(`/jobs/${jobId}/resume/generate${query}`, {
      method: 'POST',
      body: overrides ? JSON.stringify(overrides) : JSON.stringify({}),
    });
  },
};
