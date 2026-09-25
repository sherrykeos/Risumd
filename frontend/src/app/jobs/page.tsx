'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  ArrowRight,
} from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { JobModal } from '@/components/jobs/JobModal';
import { formatDate } from '@/lib/utils';
import { jobService } from '@/services/jobs';
import { Job, JobCreate } from '@/types';

export default function JobsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'analyzed' | 'pending'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: jobs, isLoading, isError, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: JobCreate) => jobService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setIsModalOpen(false);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to create job.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: JobCreate }) => jobService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setIsModalOpen(false);
      setEditingJob(null);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to update job.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => jobService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setDeletingId(null);
    },
    onError: (err: Error) => {
      alert(`Delete failed: ${err.message}`);
    },
  });

  const handleOpenAdd = () => {
    setEditingJob(null);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingJob(job);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
  };

  const handleFormSubmit = async (data: JobCreate) => {
    if (editingJob) {
      await updateMutation.mutateAsync({ id: editingJob.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const filteredJobs = jobs?.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'analyzed') return Boolean(job.analysis);
    if (statusFilter === 'pending') return !job.analysis;
    return true;
  });

  return (
    <div>
      <Header
        title="Jobs Workspace"
        description="Manage target job postings, trigger Gemini JD analysis, and match against your Career Vault."
        actions={
          <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> Add Job
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search company or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'analyzed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('analyzed')}
          >
            Analyzed
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : isError ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          Failed to load jobs: {(error as Error)?.message || 'Unknown error'}
        </div>
      ) : filteredJobs && filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              className="hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        {job.company}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {job.title}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleOpenEdit(e, job)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Job"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, job.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Job"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                    {job.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Added {formatDate(job.created_at)}</span>
                    </div>
                    {job.source_url && (
                      <a
                        href={job.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center text-slate-600 hover:text-indigo-600"
                      >
                        <ExternalLink className="mr-1 h-3 w-3" /> Posting
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-3 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                    &quot;{job.raw_description}&quot;
                  </p>
                </div>

                <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
                  <div>
                    {job.analysis ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> JD Analyzed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="mr-1 h-3 w-3" /> Needs AI Analysis
                      </Badge>
                    )}
                  </div>

                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="outline" size="sm" className="group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      Open Job Workspace <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-slate-500">No jobs match your search/filter.</p>
          <Button onClick={handleOpenAdd} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Target Job
          </Button>
        </Card>
      )}

      <JobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingJob}
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
        title="Delete Job"
        message="Are you sure you want to delete this job posting? All associated analysis and matches will be affected."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
