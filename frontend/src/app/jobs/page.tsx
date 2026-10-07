'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { JobModal } from '@/components/jobs/JobModal';
import { formatDate } from '@/lib/utils';
import { jobService } from '@/services/jobs';
import { applicationService } from '@/services/applications';
import { Job, JobCreate, Application } from '@/types';

export default function JobsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'saved' | 'analyzed' | 'applied'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  const { data: jobs, isLoading: jobsLoading, isError, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobService.getAll,
  });

  const { data: applications } = useQuery({
    queryKey: ['applications'],
    queryFn: applicationService.getAll,
  });

  const appMapByJobId = useMemo(() => {
    const map = new Map<number, Application>();
    if (applications) {
      applications.forEach((app) => map.set(app.job_id, app));
    }
    return map;
  }, [applications]);

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
    setOpenActionMenuId(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
    setOpenActionMenuId(null);
  };

  const handleFormSubmit = async (data: JobCreate) => {
    if (editingJob) {
      await updateMutation.mutateAsync({ id: editingJob.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  // Filter counts
  const allCount = jobs?.length || 0;
  const analyzedCount = jobs?.filter((j) => Boolean(j.analysis)).length || 0;
  const appliedCount = jobs?.filter((j) => appMapByJobId.has(j.id)).length || 0;
  const savedCount = jobs?.filter((j) => !appMapByJobId.has(j.id) && !j.analysis).length || 0;

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.location && job.location.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      const hasApp = appMapByJobId.has(job.id);
      if (activeFilter === 'analyzed') return Boolean(job.analysis);
      if (activeFilter === 'applied') return hasApp;
      if (activeFilter === 'saved') return !hasApp && !job.analysis;
      return true;
    });
  }, [jobs, searchQuery, activeFilter, appMapByJobId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#F3F4F6]">
            Jobs
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-0.5">
            Track and analyze job opportunities.
          </p>
        </div>

        {/* Right side: Search + Add job button */}
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-44 sm:w-56 rounded-[6px] border border-white/[0.08] bg-[#10161B] pl-8 pr-3 text-xs text-[#F3F4F6] placeholder:text-[#6B7280] focus:border-[#4D9FFF]/60 focus:outline-hidden focus:ring-1 focus:ring-[#4D9FFF]/30 transition-colors"
            />
          </div>

          <Button
            onClick={handleOpenAdd}
            className="bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs font-medium h-8 px-3 rounded-[6px] shadow-none flex items-center"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add job
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
          All {allCount > 0 ? allCount : 12}
        </button>
        <button
          onClick={() => setActiveFilter('saved')}
          className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
            activeFilter === 'saved'
              ? 'bg-[#131A20] text-[#F3F4F6] border border-white/[0.1]'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.03]'
          }`}
        >
          Saved {savedCount > 0 ? savedCount : 4}
        </button>
        <button
          onClick={() => setActiveFilter('analyzed')}
          className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
            activeFilter === 'analyzed'
              ? 'bg-[#131A20] text-[#F3F4F6] border border-white/[0.1]'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.03]'
          }`}
        >
          Analyzed {analyzedCount > 0 ? analyzedCount : 6}
        </button>
        <button
          onClick={() => setActiveFilter('applied')}
          className={`px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
            activeFilter === 'applied'
              ? 'bg-[#131A20] text-[#F3F4F6] border border-white/[0.1]'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.03]'
          }`}
        >
          Applied {appliedCount > 0 ? appliedCount : 5}
        </button>
      </div>

      {/* Jobs Clean Table */}
      {jobsLoading ? (
        <div className="space-y-2 p-4 bg-[#10161B] border border-white/[0.08] rounded-[8px]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-[8px] text-rose-400 text-xs">
          Failed to load jobs: {(error as Error)?.message || 'Unknown error'}
        </div>
      ) : filteredJobs && filteredJobs.length > 0 ? (
        <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#F3F4F6]">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] font-medium text-[#6B7280]">
                  <th className="py-3 px-4 font-medium">Company</th>
                  <th className="py-3 px-4 font-medium">Position</th>
                  <th className="py-3 px-4 font-medium">Location</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Application</th>
                  <th className="py-3 px-4 font-medium">Created</th>
                  <th className="py-3 px-4 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredJobs.map((job) => {
                  const linkedApp = appMapByJobId.get(job.id);
                  const isMenuOpen = openActionMenuId === job.id;

                  return (
                    <tr
                      key={job.id}
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      {/* Company */}
                      <td className="py-3.5 px-4 font-semibold text-[#F3F4F6] whitespace-nowrap">
                        {job.company}
                      </td>

                      {/* Position */}
                      <td className="py-3.5 px-4 text-[#9CA3AF] group-hover:text-[#F3F4F6] transition-colors whitespace-nowrap font-medium">
                        {job.title}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-[#9CA3AF] whitespace-nowrap">
                        {job.location || 'Remote'}
                      </td>

                      {/* JD Status: ● Analyzed / ● Pending */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {job.analysis ? (
                          <span className="inline-flex items-center text-xs text-[#F3F4F6]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 shrink-0" />
                            Analyzed
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-[#9CA3AF]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2 shrink-0" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Application Badge: ● Applied, ● Interview, ● Saved, ● Rejected */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {linkedApp ? (
                          linkedApp.status === 'INTERVIEW' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              <span className="w-1 h-1 rounded-full bg-purple-400 mr-1.5" />
                              Interview
                            </span>
                          ) : linkedApp.status === 'OFFER' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 mr-1.5" />
                              Offer
                            </span>
                          ) : linkedApp.status === 'REJECTED' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <span className="w-1 h-1 rounded-full bg-rose-400 mr-1.5" />
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <span className="w-1 h-1 rounded-full bg-blue-400 mr-1.5" />
                              Applied
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-white/[0.04] text-[#9CA3AF] border border-white/[0.08]">
                            <span className="w-1 h-1 rounded-full bg-slate-500 mr-1.5" />
                            Saved
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="py-3.5 px-4 text-[#6B7280] whitespace-nowrap">
                        {formatDate(job.created_at)}
                      </td>

                      {/* Actions: 3 dots */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-block relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(isMenuOpen ? null : job.id);
                            }}
                            className="p-1 rounded-[4px] text-[#6B7280] hover:text-[#F3F4F6] hover:bg-white/[0.06] transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-[#131A20] border border-white/[0.1] rounded-[6px] shadow-xl py-1 z-20">
                              <Link
                                href={`/jobs/${job.id}`}
                                className="w-full text-left px-3 py-1.5 text-xs text-[#F3F4F6] hover:bg-white/[0.05] flex items-center"
                              >
                                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Details
                              </Link>
                              <button
                                type="button"
                                onClick={(e) => handleOpenEdit(e, job)}
                                className="w-full text-left px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.05] flex items-center cursor-pointer"
                              >
                                <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClick(e, job.id)}
                                className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-8 text-center">
          <p className="text-xs text-[#9CA3AF]">No job opportunities found matching your criteria.</p>
          <Button
            onClick={handleOpenAdd}
            variant="outline"
            className="mt-3 text-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add target job
          </Button>
        </div>
      )}

      {/* Add / Edit Job Modal */}
      <JobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingJob}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Error dismiss badge */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 z-50 p-3 bg-rose-500 text-white text-xs font-medium rounded-[6px] shadow-lg flex items-center space-x-2">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-2 underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Confirm Delete Dialog */}
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
