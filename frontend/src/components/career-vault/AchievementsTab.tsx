'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Edit2, Trash2, Trophy } from 'lucide-react';

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
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);

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
    setActionMenuId(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: AchievementCreate) => {
    if (editingAch) {
      await updateMutation.mutateAsync({ id: editingAch.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#9CA3AF]">
          Awards, certifications, hackathon prizes, patents, and key career milestones.
        </p>

        <Button
          onClick={handleOpenAdd}
          className="bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs font-medium h-8 px-3 rounded-[6px] shadow-none flex items-center"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add achievement
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-[8px] text-rose-400 text-xs">
          Failed to load achievements: {(error as Error)?.message || 'Unknown error'}
        </div>
      ) : achievements && achievements.length > 0 ? (
        <div className="space-y-2.5">
          {achievements.map((ach) => {
            const isMenuOpen = actionMenuId === ach.id;

            return (
              <div
                key={ach.id}
                className="bg-[#10161B] border border-white/[0.08] hover:border-white/[0.14] rounded-[8px] p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-colors group"
              >
                <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-[6px] bg-[#0B0F12] border border-white/[0.08] flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Trophy className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <h3 className="font-semibold text-sm text-[#F3F4F6]">{ach.title}</h3>

                    {ach.date && (
                      <p className="text-xs text-[#6B7280]">
                        Achieved {formatDate(ach.date)}
                      </p>
                    )}

                    {ach.description && (
                      <p className="text-xs text-[#9CA3AF] leading-relaxed pt-1 whitespace-pre-line">
                        {ach.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end md:self-start shrink-0">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActionMenuId(isMenuOpen ? null : ach.id)}
                      className="p-1 rounded text-[#6B7280] hover:text-[#F3F4F6] hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-28 bg-[#131A20] border border-white/[0.1] rounded-[6px] shadow-xl py-1 z-20">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ach)}
                          className="w-full text-left px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.05] flex items-center cursor-pointer"
                        >
                          <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingId(ach.id);
                            setActionMenuId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-8 text-center">
          <p className="text-xs text-[#9CA3AF]">No achievements added yet.</p>
          <Button onClick={handleOpenAdd} variant="outline" className="mt-3 text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Achievement
          </Button>
        </div>
      )}

      <AchievementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingAch}
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
        title="Delete Achievement"
        message="Are you sure you want to delete this achievement record?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
