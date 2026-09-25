'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ProjectsTab } from '@/components/career-vault/ProjectsTab';
import { ExperienceTab } from '@/components/career-vault/ExperienceTab';
import { SkillsTab } from '@/components/career-vault/SkillsTab';
import { TechTab } from '@/components/career-vault/TechTab';
import { EducationTab } from '@/components/career-vault/EducationTab';
import { AchievementsTab } from '@/components/career-vault/AchievementsTab';
import { cn } from '@/lib/utils';
import {
  FolderKanban,
  Briefcase,
  ShieldCheck,
  Code,
  GraduationCap,
  Trophy,
} from 'lucide-react';

const tabs = [
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'skills', label: 'Skills', icon: ShieldCheck },
  { id: 'technologies', label: 'Technologies', icon: Code },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
];

export default function CareerVaultPage() {
  const [activeTab, setActiveTab] = useState('projects');

  return (
    <div>
      <Header
        title="Career Vault"
        description="Your central repository of professional experience, projects, skills, technologies, education, and achievements."
      />

      {/* Tabs bar */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 py-3 px-4 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer',
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-indigo-600' : 'text-slate-400')} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      {activeTab === 'projects' && <ProjectsTab />}
      {activeTab === 'experience' && <ExperienceTab />}
      {activeTab === 'skills' && <SkillsTab />}
      {activeTab === 'technologies' && <TechTab />}
      {activeTab === 'education' && <EducationTab />}
      {activeTab === 'achievements' && <AchievementsTab />}
    </div>
  );
}
