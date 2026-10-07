'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SkillModal } from './SkillModal';
import { skillService } from '@/services/career-vault';
import { Skill, SkillCreate } from '@/types';

export function SkillsTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: skills, isLoading, isError, error } = useQuery({
    queryKey: ['skills'],
    queryFn: () => skillService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: SkillCreate) => skillService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setIsModalOpen(false);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to create skill.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SkillCreate }) =>
      skillService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setIsModalOpen(false);
      setEditingSkill(null);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to update skill.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => skillService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setDeletingId(null);
    },
    onError: (err: Error) => {
      alert(`Delete failed: ${err.message}`);
    },
  });

  const handleOpenAdd = () => {
    setEditingSkill(null);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: SkillCreate) => {
    if (editingSkill) {
      await updateMutation.mutateAsync({ id: editingSkill.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const groupedSkills: Record<string, Skill[]> = {};
  if (skills) {
    skills.forEach((skill) => {
      const cat = skill.category || 'General';
      if (!groupedSkills[cat]) {
        groupedSkills[cat] = [];
      }
      groupedSkills[cat].push(skill);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#9CA3AF]">
          Domain competencies, methodologies, and technical skillsets.
        </p>

        <Button
          onClick={handleOpenAdd}
          className="bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs font-medium h-8 px-3 rounded-[6px] shadow-none flex items-center"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add skill
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-[8px] text-rose-400 text-xs">
          Failed to load skills: {(error as Error)?.message || 'Unknown error'}
        </div>
      ) : skills && skills.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedSkills).map(([category, items]) => (
            <div key={category} className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-4 space-y-3">
              <h3 className="text-xs font-semibold text-[#F3F4F6] uppercase tracking-wider flex items-center">
                <ShieldCheck className="h-3.5 w-3.5 text-[#4D9FFF] mr-1.5" />
                {category} <span className="text-[#6B7280] ml-1.5 font-normal">({items.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {items.map((skill) => (
                  <div
                    key={skill.id}
                    className="p-2.5 rounded-[6px] border border-white/[0.06] bg-[#0B0F12] flex items-center justify-between group hover:border-white/[0.12] transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-medium text-xs text-[#F3F4F6] block truncate">{skill.name}</span>
                      {skill.description && (
                        <p className="text-[11px] text-[#6B7280] truncate mt-0.5">{skill.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleOpenEdit(skill)}
                        className="p-1 text-[#6B7280] hover:text-[#F3F4F6] rounded cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setDeletingId(skill.id)}
                        className="p-1 text-[#6B7280] hover:text-rose-400 rounded cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-8 text-center">
          <p className="text-xs text-[#9CA3AF]">No skills added yet.</p>
          <Button onClick={handleOpenAdd} variant="outline" className="mt-3 text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Skill
          </Button>
        </div>
      )}

      <SkillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingSkill}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {errorMessage && (
        <div className="fixed bottom-4 right-4 z-50 p-3 bg-rose-500 text-white text-xs font-medium rounded-[6px] shadow-lg flex items-center space-x-2">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-2 underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Delete Skill"
        message="Are you sure you want to delete this skill record?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
