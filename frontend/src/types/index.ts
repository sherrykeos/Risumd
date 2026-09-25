export interface Skill {
  id: number;
  name: string;
  category?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillCreate {
  name: string;
  category?: string | null;
  description?: string | null;
}

export interface SkillUpdate {
  name?: string;
  category?: string | null;
  description?: string | null;
}

export interface Technology {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TechnologyCreate {
  name: string;
  description?: string | null;
}

export interface TechnologyUpdate {
  name?: string;
  description?: string | null;
}

export interface Achievement {
  id: number;
  title: string;
  description?: string | null;
  date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AchievementCreate {
  title: string;
  description?: string | null;
  date?: string | null;
}

export interface AchievementUpdate {
  title?: string;
  description?: string | null;
  date?: string | null;
}

export interface Education {
  id: number;
  institution: string;
  degree: string;
  field?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  grade?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EducationCreate {
  institution: string;
  degree: string;
  field?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  grade?: string | null;
  description?: string | null;
}

export interface EducationUpdate {
  institution?: string;
  degree?: string;
  field?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  grade?: string | null;
  description?: string | null;
}

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  role?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  github_url?: string | null;
  live_url?: string | null;
  created_at: string;
  updated_at: string;
  skills: Skill[];
  technologies: Technology[];
  achievements: Achievement[];
}

export interface ProjectCreate {
  name: string;
  description?: string | null;
  role?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  github_url?: string | null;
  live_url?: string | null;
  technologies?: (string | number)[];
  skills?: (string | number)[];
  achievements?: (number | { id?: number; title?: string; description?: string; date?: string })[];
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
  role?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  github_url?: string | null;
  live_url?: string | null;
  technologies?: (string | number)[];
  skills?: (string | number)[];
  achievements?: (number | { id?: number; title?: string; description?: string; date?: string })[];
}

export interface Experience {
  id: number;
  company: string;
  role: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  created_at: string;
  updated_at: string;
  skills: Skill[];
  technologies: Technology[];
  achievements: Achievement[];
}

export interface ExperienceCreate {
  company: string;
  role: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  technologies?: (string | number)[];
  skills?: (string | number)[];
  achievements?: (number | { id?: number; title?: string; description?: string; date?: string })[];
}

export interface ExperienceUpdate {
  company?: string;
  role?: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  technologies?: (string | number)[];
  skills?: (string | number)[];
  achievements?: (number | { id?: number; title?: string; description?: string; date?: string })[];
}

export interface JDAnalysis {
  id: number;
  job_id: number;
  seniority?: string | null;
  domain?: string | null;
  required_skills: string[];
  preferred_skills: string[];
  technologies: string[];
  responsibilities: string[];
  keywords: string[];
  summary?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JDAnalysisCreate {
  seniority?: string | null;
  domain?: string | null;
  required_skills?: string[];
  preferred_skills?: string[];
  technologies?: string[];
  responsibilities?: string[];
  keywords?: string[];
  summary?: string | null;
}

export interface JDAnalysisUpdate {
  seniority?: string | null;
  domain?: string | null;
  required_skills?: string[];
  preferred_skills?: string[];
  technologies?: string[];
  responsibilities?: string[];
  keywords?: string[];
  summary?: string | null;
}

export interface Job {
  id: number;
  company: string;
  title: string;
  location?: string | null;
  source_url?: string | null;
  raw_description: string;
  created_at: string;
  updated_at: string;
  analysis?: JDAnalysis | null;
}

export interface JobCreate {
  company: string;
  title: string;
  location?: string | null;
  source_url?: string | null;
  raw_description: string;
}

export interface JobUpdate {
  company?: string;
  title?: string;
  location?: string | null;
  source_url?: string | null;
  raw_description?: string;
}

export interface MatchBreakdown {
  score: number;
  matched_technologies: string[];
  matched_skills: string[];
  matched_keywords: string[];
  reasons: string[];
}

export interface RankedProject {
  id: number;
  name: string;
  role?: string | null;
  score: number;
  match_breakdown: MatchBreakdown;
  matched_technologies: string[];
  matched_skills: string[];
}

export interface RankedExperience {
  id: number;
  company: string;
  role: string;
  score: number;
  match_breakdown: MatchBreakdown;
  matched_technologies: string[];
  matched_skills: string[];
}

export interface RankedSkill {
  id: number;
  name: string;
  category?: string | null;
  score: number;
  match_breakdown: MatchBreakdown;
}

export interface RankedTechnology {
  id: number;
  name: string;
  score: number;
  match_breakdown: MatchBreakdown;
}

export interface RankedAchievement {
  id: number;
  title: string;
  score: number;
  match_breakdown: MatchBreakdown;
}

export interface JobMatchResponse {
  job_id: number;
  job_title: string;
  company: string;
  projects: RankedProject[];
  experiences: RankedExperience[];
  skills: RankedSkill[];
  technologies: RankedTechnology[];
  achievements: RankedAchievement[];
}

export interface ResumeGenerateRequest {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  github?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
}

export interface ResumeVersion {
  id: number;
  job_id: number;
  version_number: number;
  resume_data: Record<string, unknown>;
  pdf_available: boolean;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface ApplicationStatusHistory {
  id: number;
  application_id: number;
  old_status?: string | null;
  new_status: string;
  changed_at: string;
  note?: string | null;
}

export interface Application {
  id: number;
  job_id: number;
  resume_version_id: number;
  status: ApplicationStatus;
  applied_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  job?: Job | null;
  status_history: ApplicationStatusHistory[];
}

export interface ApplicationCreate {
  job_id: number;
  resume_version_id: number;
  status?: ApplicationStatus;
  applied_at?: string | null;
  notes?: string | null;
}

export interface ApplicationUpdate {
  status?: ApplicationStatus;
  applied_at?: string | null;
  notes?: string | null;
  status_change_note?: string | null;
}
