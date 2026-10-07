'use client';

import React, { useState } from 'react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#F3F4F6]">
            Career Vault
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-0.5">
            Your professional information and achievements.
          </p>
        </div>
      </div>

      {/* Understated Underline Tabs */}
      <div className="flex border-b border-white/[0.08] space-x-6 overflow-x-auto text-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer',
                isActive
                  ? 'border-[#4D9FFF] text-[#F3F4F6]'
                  : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-[#4D9FFF]' : 'text-[#6B7280]')} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="pt-2">
        {activeTab === 'projects' && <ProjectsTab />}
        {activeTab === 'experience' && <ExperienceTab />}
        {activeTab === 'skills' && <SkillsTab />}
        {activeTab === 'technologies' && <TechTab />}
        {activeTab === 'education' && <EducationTab />}
        {activeTab === 'achievements' && <AchievementsTab />}
      </div>
    </div>
  );
}
