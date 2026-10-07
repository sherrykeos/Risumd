'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Code } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TechModal } from './TechModal';
import { technologyService } from '@/services/career-vault';
import { Technology, TechnologyCreate } from '@/types';

export function TechTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technology | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: technologies, isLoading, isError, error } = useQuery({
    queryKey: ['technologies'],
    queryFn: technologyService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: TechnologyCreate) => technologyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technologies'] });
      setIsModalOpen(false);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to create technology.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TechnologyCreate }) =>
      technologyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technologies'] });
      setIsModalOpen(false);
      setEditingTech(null);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to update technology.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => technologyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technologies'] });
      setDeletingId(null);
    },
    onError: (err: Error) => {
      alert(`Delete failed: ${err.message}`);
    },
  });

  const handleOpenAdd = () => {
    setEditingTech(null);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tech: Technology) => {
    setEditingTech(tech);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: TechnologyCreate) => {
    if (editingTech) {
      await updateMutation.mutateAsync({ id: editingTech.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#9CA3AF]">
          Languages, frameworks, databases, libraries, and developer tools.
        </p>

        <Button
          onClick={handleOpenAdd}
          className="bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs font-medium h-8 px-3 rounded-[6px] shadow-none flex items-center"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add technology
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-[8px] text-rose-400 text-xs">
          Failed to load technologies: {(error as Error)?.message || 'Unknown error'}
        </div>
      ) : technologies && technologies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {technologies.map((tech) => (
            <div
              key={tech.id}
              className="bg-[#10161B] border border-white/[0.08] hover:border-white/[0.14] rounded-[8px] p-3 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-[5px] bg-[#0B0F12] border border-white/[0.06] text-[#4D9FFF] flex items-center justify-center shrink-0">
                  <Code className="h-3.5 w-3.5" />
                </div>
                <div className="truncate">
                  <span className="font-medium text-xs text-[#F3F4F6] block truncate">
                    {tech.name}
                  </span>
                  {tech.description && (
                    <span className="text-[11px] text-[#6B7280] block truncate">
                      {tech.description}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2 shrink-0">
                <button
                  onClick={() => handleOpenEdit(tech)}
                  className="p-1 text-[#6B7280] hover:text-[#F3F4F6] rounded cursor-pointer"
                  title="Edit"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setDeletingId(tech.id)}
                  className="p-1 text-[#6B7280] hover:text-rose-400 rounded cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-8 text-center">
          <p className="text-xs text-[#9CA3AF]">No technologies added yet.</p>
          <Button onClick={handleOpenAdd} variant="outline" className="mt-3 text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Technology
          </Button>
        </div>
      )}

      <TechModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingTech}
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
        title="Delete Technology"
        message="Are you sure you want to delete this technology record?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
