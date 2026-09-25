'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Code } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
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
        Failed to load technologies: {(error as Error)?.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Technologies</h2>
          <p className="text-xs text-slate-500">
            Languages, frameworks, databases, libraries, and developer tools.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Add Technology
        </Button>
      </div>

      {technologies && technologies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {technologies.map((tech) => (
            <Card key={tech.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Code className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">{tech.name}</h3>
                    {tech.description && (
                      <p className="text-xs text-slate-500 truncate">{tech.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 pl-2">
                  <button
                    onClick={() => handleOpenEdit(tech)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                    title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(tech.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-slate-500">No technologies added yet.</p>
          <Button onClick={handleOpenAdd} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Technology
          </Button>
        </Card>
      )}

      <TechModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingTech}
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
        title="Delete Technology"
        message="Are you sure you want to delete this technology record?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
