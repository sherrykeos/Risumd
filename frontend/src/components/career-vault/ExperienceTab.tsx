'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Calendar, MapPin, Code, ShieldCheck } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ExperienceModal } from './ExperienceModal';
import { formatDate } from '@/lib/utils';
import { experienceService } from '@/services/career-vault';
import { Experience, ExperienceCreate } from '@/types';

export function ExperienceTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: experiences, isLoading, isError, error } = useQuery({
    queryKey: ['experience'],
    queryFn: experienceService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: ExperienceCreate) => experienceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience'] });
      setIsModalOpen(false);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to create experience.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExperienceCreate }) =>
      experienceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience'] });
      setIsModalOpen(false);
      setEditingExp(null);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to update experience.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => experienceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience'] });
      setDeletingId(null);
    },
    onError: (err: Error) => {
      alert(`Delete failed: ${err.message}`);
    },
  });

  const handleOpenAdd = () => {
    setEditingExp(null);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: Experience) => {
    setEditingExp(exp);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: ExperienceCreate) => {
    if (editingExp) {
      await updateMutation.mutateAsync({ id: editingExp.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
        Failed to load work experience: {(error as Error)?.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Work Experience</h2>
          <p className="text-xs text-slate-500">
            Employment history, positions, key achievements, and tools used.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Add Experience
        </Button>
      </div>

      {experiences && experiences.length > 0 ? (
        <div className="space-y-4">
          {experiences.map((exp) => (
            <Card key={exp.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{exp.role}</h3>
                    <p className="text-sm font-semibold text-indigo-600">{exp.company}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                      {(exp.start_date || exp.end_date) && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : 'Present'}
                          </span>
                        </div>
                      )}
                      {exp.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{exp.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(exp)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(exp.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {exp.description && (
                  <p className="text-sm text-slate-600 mt-3 whitespace-pre-line leading-relaxed">
                    {exp.description}
                  </p>
                )}

                <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
                  {exp.technologies && exp.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <Code className="h-3.5 w-3.5 text-slate-400 mr-1" />
                      {exp.technologies.map((tech) => (
                        <Badge key={tech.id} variant="secondary" className="text-[10px]">
                          {tech.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {exp.skills && exp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400 mr-1" />
                      {exp.skills.map((skill) => (
                        <Badge key={skill.id} variant="outline" className="text-[10px]">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-slate-500">No work experience added yet.</p>
          <Button onClick={handleOpenAdd} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Experience Record
          </Button>
        </Card>
      )}

      <ExperienceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingExp}
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
        title="Delete Work Experience"
        message="Are you sure you want to delete this experience record? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
