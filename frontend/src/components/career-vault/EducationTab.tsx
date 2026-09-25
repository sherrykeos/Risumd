'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, GraduationCap, Calendar, Award } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EducationModal } from './EducationModal';
import { formatDate } from '@/lib/utils';
import { educationService } from '@/services/career-vault';
import { Education, EducationCreate } from '@/types';

export function EducationTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEdu, setEditingEdu] = useState<Education | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: educationList, isLoading, isError, error } = useQuery({
    queryKey: ['education'],
    queryFn: educationService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: EducationCreate) => educationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education'] });
      setIsModalOpen(false);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to create education.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EducationCreate }) =>
      educationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education'] });
      setIsModalOpen(false);
      setEditingEdu(null);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to update education.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => educationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education'] });
      setDeletingId(null);
    },
    onError: (err: Error) => {
      alert(`Delete failed: ${err.message}`);
    },
  });

  const handleOpenAdd = () => {
    setEditingEdu(null);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (edu: Education) => {
    setEditingEdu(edu);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: EducationCreate) => {
    if (editingEdu) {
      await updateMutation.mutateAsync({ id: editingEdu.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
        Failed to load education: {(error as Error)?.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Education</h2>
          <p className="text-xs text-slate-500">
            Degrees, academic background, universities, and diplomas.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Add Education
        </Button>
      </div>

      {educationList && educationList.length > 0 ? (
        <div className="space-y-4">
          {educationList.map((edu) => (
            <Card key={edu.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 mt-1">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{edu.degree}</h3>
                      <p className="text-sm font-semibold text-indigo-600">{edu.institution}</p>
                      {edu.field && (
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">Field: {edu.field}</p>
                      )}
                      {(edu.start_date || edu.end_date) && (
                        <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : 'Present'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {edu.grade && (
                      <Badge variant="secondary" className="text-xs">
                        <Award className="mr-1 h-3 w-3" /> {edu.grade}
                      </Badge>
                    )}
                    <button
                      onClick={() => handleOpenEdit(edu)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(edu.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {edu.description && (
                  <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100 whitespace-pre-line leading-relaxed">
                    {edu.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-slate-500">No education records added yet.</p>
          <Button onClick={handleOpenAdd} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Education
          </Button>
        </Card>
      )}

      <EducationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingEdu}
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
        title="Delete Education Record"
        message="Are you sure you want to delete this education entry?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
