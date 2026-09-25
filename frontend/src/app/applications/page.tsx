'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutList, Kanban, Send } from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

import { ApplicationTable } from '@/components/applications/ApplicationTable';
import { ApplicationKanban } from '@/components/applications/ApplicationKanban';
import { ApplicationModal } from '@/components/applications/ApplicationModal';
import { StatusHistoryModal } from '@/components/applications/StatusHistoryModal';

import { applicationService } from '@/services/applications';
import { jobService } from '@/services/jobs';
import { resumeService } from '@/services/resumes';
import { Application, ApplicationCreate, ApplicationStatus, ApplicationUpdate } from '@/types';

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [historyApp, setHistoryApp] = useState<Application | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: applications, isLoading, isError, error } = useQuery({
    queryKey: ['applications'],
    queryFn: applicationService.getAll,
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobService.getAll,
  });

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: ApplicationCreate) => applicationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setIsModalOpen(false);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to create application.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApplicationUpdate }) => applicationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setIsModalOpen(false);
      setEditingApp(null);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to update application.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => applicationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setDeletingId(null);
    },
    onError: (err: Error) => {
      alert(`Delete failed: ${err.message}`);
    },
  });

  const handleOpenAdd = () => {
    setEditingApp(null);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (app: Application) => {
    setEditingApp(app);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: ApplicationCreate) => {
    if (editingApp) {
      await updateMutation.mutateAsync({
        id: editingApp.id,
        data: {
          status: data.status,
          applied_at: data.applied_at,
          notes: data.notes,
        },
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleQuickStatusChange = async (appId: number, newStatus: ApplicationStatus) => {
    try {
      await updateMutation.mutateAsync({
        id: appId,
        data: {
          status: newStatus,
          status_change_note: `Status quick updated to ${newStatus}`,
        },
      });
    } catch (e: unknown) {
      setErrorMessage((e as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
        Failed to load applications: {(error as Error)?.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Application Tracker"
        description="Track job applications, update interview statuses, and audit complete transition histories."
        actions={
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-slate-200/70 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Kanban className="h-3.5 w-3.5" />
                <span>Kanban</span>
              </button>
            </div>

            <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" /> Add Application
            </Button>
          </div>
        }
      />

      {applications && applications.length > 0 ? (
        <div>
          {viewMode === 'table' ? (
            <ApplicationTable
              applications={applications}
              onEdit={handleOpenEdit}
              onDelete={(id) => setDeletingId(id)}
              onViewHistory={(app) => setHistoryApp(app)}
              onQuickStatusChange={handleQuickStatusChange}
            />
          ) : (
            <ApplicationKanban
              applications={applications}
              onEdit={handleOpenEdit}
              onDelete={(id) => setDeletingId(id)}
              onViewHistory={(app) => setHistoryApp(app)}
            />
          )}
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <Send className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900">No Job Applications Tracked Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Link a target job posting with a generated resume version to track your application lifecycle.
          </p>
          <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> Track First Application
          </Button>
        </Card>
      )}

      {jobs && resumes && (
        <ApplicationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
          jobs={jobs}
          resumes={resumes}
          initialData={editingApp}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <StatusHistoryModal
        isOpen={historyApp !== null}
        onClose={() => setHistoryApp(null)}
        application={historyApp}
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
        title="Delete Application"
        message="Are you sure you want to delete this application record?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
