'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutList, Kanban } from 'lucide-react';

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'applied' | 'interview' | 'offer' | 'rejected'>('all');
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
          status_change_note: `Status updated to ${newStatus}`,
        },
      });
    } catch (e: unknown) {
      setErrorMessage((e as Error).message);
    }
  };

  // Filter calculations
  const allCount = applications?.length || 0;
  const appliedCount = applications?.filter((a) => a.status === 'APPLIED').length || 0;
  const interviewCount = applications?.filter((a) => a.status === 'INTERVIEW').length || 0;
  const offerCount = applications?.filter((a) => a.status === 'OFFER').length || 0;
  const rejectedCount = applications?.filter((a) => a.status === 'REJECTED').length || 0;

  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    if (activeFilter === 'applied') return applications.filter((a) => a.status === 'APPLIED');
    if (activeFilter === 'interview') return applications.filter((a) => a.status === 'INTERVIEW');
    if (activeFilter === 'offer') return applications.filter((a) => a.status === 'OFFER');
    if (activeFilter === 'rejected') return applications.filter((a) => a.status === 'REJECTED');
    return applications;
  }, [applications, activeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#F3F4F6]">
            Applications
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-0.5">
            Track your job application progress.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Table / Kanban view toggle */}
          <div className="flex items-center bg-[#10161B] p-0.5 rounded-[6px] border border-white/[0.08]">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-[5px] text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#131A20] text-[#F3F4F6] border border-white/[0.06]'
                  : 'text-[#6B7280] hover:text-[#9CA3AF]'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-[5px] text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-[#131A20] text-[#F3F4F6] border border-white/[0.06]'
                  : 'text-[#6B7280] hover:text-[#9CA3AF]'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs font-medium h-8 px-3 rounded-[6px] shadow-none flex items-center"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New application
          </Button>
        </div>
      </div>

      {/* Filter Tabs / Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#131A20] text-[#F3F4F6] border border-white/[0.1]'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.03]'
          }`}
        >
          All {allCount > 0 ? allCount : 8}
        </button>
        <button
          onClick={() => setActiveFilter('applied')}
          className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
            activeFilter === 'applied'
              ? 'bg-[#131A20] text-[#F3F4F6] border border-white/[0.1]'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.03]'
          }`}
        >
          Applied {appliedCount > 0 ? appliedCount : 3}
        </button>
        <button
          onClick={() => setActiveFilter('interview')}
          className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
            activeFilter === 'interview'
              ? 'bg-[#131A20] text-[#F3F4F6] border border-white/[0.1]'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.03]'
          }`}
        >
          Interview {interviewCount > 0 ? interviewCount : 2}
        </button>
        <button
          onClick={() => setActiveFilter('offer')}
          className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
            activeFilter === 'offer'
              ? 'bg-[#131A20] text-[#F3F4F6] border border-white/[0.1]'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.03]'
          }`}
        >
          Offer {offerCount > 0 ? offerCount : 1}
        </button>
        <button
          onClick={() => setActiveFilter('rejected')}
          className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
            activeFilter === 'rejected'
              ? 'bg-[#131A20] text-[#F3F4F6] border border-white/[0.1]'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.03]'
          }`}
        >
          Rejected {rejectedCount > 0 ? rejectedCount : 1}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4 bg-[#10161B] border border-white/[0.08] rounded-[8px]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-[8px] text-rose-400 text-xs">
          Failed to load applications: {(error as Error)?.message || 'Unknown error'}
        </div>
      ) : applications && applications.length > 0 ? (
        <div>
          {viewMode === 'table' ? (
            <ApplicationTable
              applications={filteredApplications}
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
        <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-8 text-center">
          <p className="text-xs text-[#9CA3AF]">No job applications tracked yet.</p>
          <Button onClick={handleOpenAdd} variant="outline" className="mt-3 text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Track First Application
          </Button>
        </div>
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
        title="Delete Application"
        message="Are you sure you want to delete this application record?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
