import { fetchApi } from '@/lib/api-client';
import {
  Project,
  ProjectCreate,
  ProjectUpdate,
  Experience,
  ExperienceCreate,
  ExperienceUpdate,
  Skill,
  SkillCreate,
  SkillUpdate,
  Technology,
  TechnologyCreate,
  TechnologyUpdate,
  Education,
  EducationCreate,
  EducationUpdate,
  Achievement,
  AchievementCreate,
  AchievementUpdate,
} from '@/types';

// Projects API
export const projectService = {
  getAll: () => fetchApi<Project[]>('/projects'),
  getById: (id: number) => fetchApi<Project>(`/projects/${id}`),
  create: (data: ProjectCreate) => fetchApi<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: ProjectUpdate) => fetchApi<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/projects/${id}`, { method: 'DELETE' }),
};

// Experience API
export const experienceService = {
  getAll: () => fetchApi<Experience[]>('/experience'),
  getById: (id: number) => fetchApi<Experience>(`/experience/${id}`),
  create: (data: ExperienceCreate) => fetchApi<Experience>('/experience', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: ExperienceUpdate) => fetchApi<Experience>(`/experience/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/experience/${id}`, { method: 'DELETE' }),
};

// Skills API
export const skillService = {
  getAll: (category?: string) => {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return fetchApi<Skill[]>(`/skills${params}`);
  },
  getById: (id: number) => fetchApi<Skill>(`/skills/${id}`),
  create: (data: SkillCreate) => fetchApi<Skill>('/skills', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: SkillUpdate) => fetchApi<Skill>(`/skills/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/skills/${id}`, { method: 'DELETE' }),
};

// Technologies API
export const technologyService = {
  getAll: () => fetchApi<Technology[]>('/technologies'),
  getById: (id: number) => fetchApi<Technology>(`/technologies/${id}`),
  create: (data: TechnologyCreate) => fetchApi<Technology>('/technologies', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: TechnologyUpdate) => fetchApi<Technology>(`/technologies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/technologies/${id}`, { method: 'DELETE' }),
};

// Education API
export const educationService = {
  getAll: () => fetchApi<Education[]>('/education'),
  getById: (id: number) => fetchApi<Education>(`/education/${id}`),
  create: (data: EducationCreate) => fetchApi<Education>('/education', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: EducationUpdate) => fetchApi<Education>(`/education/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/education/${id}`, { method: 'DELETE' }),
};

// Achievements API
export const achievementService = {
  getAll: () => fetchApi<Achievement[]>('/achievements'),
  getById: (id: number) => fetchApi<Achievement>(`/achievements/${id}`),
  create: (data: AchievementCreate) => fetchApi<Achievement>('/achievements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: AchievementUpdate) => fetchApi<Achievement>(`/achievements/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/achievements/${id}`, { method: 'DELETE' }),
};
