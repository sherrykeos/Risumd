'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ShieldCheck } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
        Failed to load skills: {(error as Error)?.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Skills</h2>
          <p className="text-xs text-slate-500">
            Domain competencies, methodologies, and technical skillsets.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Add Skill
        </Button>
      </div>

      {skills && skills.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedSkills).map(([category, items]) => (
            <Card key={category}>
              <CardContent className="p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                  <ShieldCheck className="h-4 w-4 text-indigo-600 mr-2" />
                  {category} ({items.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {items.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 text-sm">{skill.name}</span>
                        {skill.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">{skill.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(skill)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(skill.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-slate-500">No skills added yet.</p>
          <Button onClick={handleOpenAdd} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Skill
          </Button>
        </Card>
      )}

      <SkillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingSkill}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {errorMessage && (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-rose-600 text-white text-sm font-medium rounded-xl shadow-lg flex items-center space-x-2">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-2 underline text-xs">
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
