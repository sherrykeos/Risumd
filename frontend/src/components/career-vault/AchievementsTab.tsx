'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Trophy, Calendar } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AchievementModal } from './AchievementModal';
import { formatDate } from '@/lib/utils';
import { achievementService } from '@/services/career-vault';
import { Achievement, AchievementCreate } from '@/types';

export function AchievementsTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAch, setEditingAch] = useState<Achievement | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: achievements, isLoading, isError, error } = useQuery({
    queryKey: ['achievements'],
    queryFn: achievementService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: AchievementCreate) => achievementService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      setIsModalOpen(false);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to create achievement.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AchievementCreate }) =>
      achievementService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      setIsModalOpen(false);
      setEditingAch(null);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to update achievement.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => achievementService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      setDeletingId(null);
    },
    onError: (err: Error) => {
      alert(`Delete failed: ${err.message}`);
    },
  });

  const handleOpenAdd = () => {
    setEditingAch(null);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ach: Achievement) => {
    setEditingAch(ach);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: AchievementCreate) => {
    if (editingAch) {
      await updateMutation.mutateAsync({ id: editingAch.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

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
        Failed to load achievements: {(error as Error)?.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Achievements & Honors</h2>
          <p className="text-xs text-slate-500">
            Awards, certifications, hackathon prizes, patents, and key career milestones.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Add Achievement
        </Button>
      </div>

      {achievements && achievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((ach) => (
            <Card key={ach.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600 mt-0.5">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{ach.title}</h3>
                      {ach.date && (
                        <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(ach.date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(ach)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(ach.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {ach.description && (
                  <p className="text-sm text-slate-600 mt-3 pt-2 border-t border-slate-100 leading-relaxed">
                    {ach.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-slate-500">No achievements added yet.</p>
          <Button onClick={handleOpenAdd} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Achievement
          </Button>
        </Card>
      )}

      <AchievementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingAch}
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
        title="Delete Achievement"
        message="Are you sure you want to delete this achievement record?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
