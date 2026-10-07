'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Briefcase,
  MapPin,
  Calendar,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);

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
    setActionMenuId(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: ExperienceCreate) => {
    if (editingExp) {
      await updateMutation.mutateAsync({ id: editingExp.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#9CA3AF]">
          Employment history, positions, and responsibilities.
        </p>

        <Button
          onClick={handleOpenAdd}
          className="bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs font-medium h-8 px-3 rounded-[6px] shadow-none flex items-center"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add experience
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-[8px] text-rose-400 text-xs">
          Failed to load experience: {(error as Error)?.message || 'Unknown error'}
        </div>
      ) : experiences && experiences.length > 0 ? (
        <div className="space-y-2.5">
          {experiences.map((exp) => {
            const isMenuOpen = actionMenuId === exp.id;
            const dateRange =
              exp.start_date || exp.end_date
                ? `${formatDate(exp.start_date)} — ${
                    exp.end_date ? formatDate(exp.end_date) : 'Present'
                  }`
                : null;

            return (
              <div
                key={exp.id}
                className="bg-[#10161B] border border-white/[0.08] hover:border-white/[0.14] rounded-[8px] p-4 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-colors group"
              >
                {/* Left: Icon + Content */}
                <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-[6px] bg-[#0B0F12] border border-white/[0.08] flex items-center justify-center text-[#4D9FFF] shrink-0 mt-0.5">
                    <Briefcase className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-sm text-[#F3F4F6]">{exp.role}</h3>
                      <span className="text-xs text-[#4D9FFF] font-medium">· {exp.company}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-[#6B7280]">
                      {dateRange && <span>{dateRange}</span>}
                      {exp.location && <span>· {exp.location}</span>}
                    </div>

                    {exp.description && (
                      <p className="text-xs text-[#9CA3AF] leading-relaxed pt-1 whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}

                    {/* Technologies tags */}
                    {exp.technologies && exp.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {exp.technologies.map((tech) => (
                          <span
                            key={tech.id}
                            className="px-2 py-0.5 rounded-[4px] bg-white/[0.04] text-[#9CA3AF] border border-white/[0.08] text-[11px] font-mono"
                          >
                            {tech.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 self-end md:self-start shrink-0">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActionMenuId(isMenuOpen ? null : exp.id)}
                      className="p-1 rounded text-[#6B7280] hover:text-[#F3F4F6] hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-28 bg-[#131A20] border border-white/[0.1] rounded-[6px] shadow-xl py-1 z-20">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(exp)}
                          className="w-full text-left px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.05] flex items-center cursor-pointer"
                        >
                          <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingId(exp.id);
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
          <p className="text-xs text-[#9CA3AF]">No work experience records added yet.</p>
          <Button onClick={handleOpenAdd} variant="outline" className="mt-3 text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Experience Record
          </Button>
        </div>
      )}

      <ExperienceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingExp}
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
        title="Delete Work Experience"
        message="Are you sure you want to delete this experience record? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
