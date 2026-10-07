'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Edit2,
  FileText,
  Send,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { JobModal } from '@/components/jobs/JobModal';
import { JDAnalysisSection } from '@/components/jobs/JDAnalysisSection';
import { MatchesSection } from '@/components/jobs/MatchesSection';
import { ApplicationModal } from '@/components/applications/ApplicationModal';

import { formatDate } from '@/lib/utils';
import { jobService } from '@/services/jobs';
import { resumeService } from '@/services/resumes';
import { applicationService } from '@/services/applications';
import { ApplicationCreate, JobCreate } from '@/types';

type TabType = 'overview' | 'description' | 'analysis' | 'matches' | 'resumes' | 'application';

export default function JobDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const jobId = Number(params.id);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  const { data: job, isLoading, isError, error } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobService.getById(jobId),
    enabled: Boolean(jobId),
  });

  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ['job-resumes', jobId],
    queryFn: () => resumeService.getForJob(jobId),
    enabled: Boolean(jobId),
  });

  const { data: applications } = useQuery({
    queryKey: ['applications'],
    queryFn: applicationService.getAll,
  });

  const linkedApplication = applications?.find((app) => app.job_id === jobId);

  const updateJobMutation = useMutation({
    mutationFn: (data: JobCreate) => jobService.update(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setIsEditModalOpen(false);
    },
  });

  const createAppMutation = useMutation({
    mutationFn: (data: ApplicationCreate) => applicationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setIsAppModalOpen(false);
      setAppError(null);
    },
    onError: (err: Error) => {
      setAppError(err.message || 'Failed to create application.');
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: () => jobService.generateAnalysis(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-matches', jobId] });
      setActiveTab('analysis');
    },
    onError: (err: Error) => {
      alert(`AI Analysis failed: ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-14 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Skeleton className="md:col-span-4 h-64" />
          <Skeleton className="md:col-span-8 h-64" />
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="p-8 text-center bg-[#10161B] border border-white/[0.08] rounded-[8px]">
        <h2 className="text-base font-semibold text-[#F3F4F6]">Job Not Found</h2>
        <p className="text-xs text-[#9CA3AF] mt-1">
          {(error as Error)?.message || 'The specified job opportunity could not be retrieved.'}
        </p>
        <Link href="/jobs">
          <Button variant="outline" className="mt-4 text-xs">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Jobs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Jobs
        </Link>
      </div>

      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#F3F4F6]">
            {job.title}
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            {job.company} · {job.location || 'Remote'} · Full-time
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs h-8 px-3"
          >
            <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>

          <Button
            onClick={() => analyzeMutation.mutate()}
            isLoading={analyzeMutation.isPending}
            className="bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs h-8 px-3 shadow-none flex items-center"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Analyze with AI
          </Button>
        </div>
      </div>

      {/* Understated Underline Tabs */}
      <div className="flex border-b border-white/[0.08] space-x-6 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-[#4D9FFF] text-[#F3F4F6]'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('description')}
          className={`py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'description'
              ? 'border-[#4D9FFF] text-[#F3F4F6]'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          Job Description
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'analysis'
              ? 'border-[#4D9FFF] text-[#F3F4F6]'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          JD Analysis
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'matches'
              ? 'border-[#4D9FFF] text-[#F3F4F6]'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          Matches
        </button>
        <button
          onClick={() => setActiveTab('resumes')}
          className={`py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'resumes'
              ? 'border-[#4D9FFF] text-[#F3F4F6]'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          Resume ({resumes?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('application')}
          className={`py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'application'
              ? 'border-[#4D9FFF] text-[#F3F4F6]'
              : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          Application
        </button>
      </div>

      {/* Tab: Overview (matching Panel 3 side-by-side layout) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Job Information */}
          <div className="md:col-span-5 bg-[#10161B] border border-white/[0.08] rounded-[8px] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#F3F4F6] tracking-tight pb-3 border-b border-white/[0.06]">
              Job Information
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[11px] font-medium text-[#6B7280] block">Company</span>
                <span className="text-[#F3F4F6] font-medium mt-0.5 block">{job.company}</span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-[#6B7280] block">Position</span>
                <span className="text-[#F3F4F6] font-medium mt-0.5 block">{job.title}</span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-[#6B7280] block">Location</span>
                <span className="text-[#F3F4F6] mt-0.5 block">{job.location || 'Bengaluru, India'}</span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-[#6B7280] block">Employment type</span>
                <span className="text-[#F3F4F6] mt-0.5 block">Full-time</span>
              </div>

              {job.source_url && (
                <div>
                  <span className="text-[11px] font-medium text-[#6B7280] block">Source URL</span>
                  <a
                    href={job.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4D9FFF] hover:underline inline-flex items-center gap-1 mt-0.5 truncate max-w-full"
                  >
                    <span className="truncate">{job.source_url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              )}

              <div>
                <span className="text-[11px] font-medium text-[#6B7280] block">Created</span>
                <span className="text-[#9CA3AF] mt-0.5 block">{formatDate(job.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Right: Job Description */}
          <div className="md:col-span-7 bg-[#10161B] border border-white/[0.08] rounded-[8px] p-5 flex flex-col">
            <h3 className="text-sm font-semibold text-[#F3F4F6] tracking-tight pb-3 border-b border-white/[0.06]">
              Job Description
            </h3>

            <div className="mt-4 max-h-[440px] overflow-y-auto pr-2 text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-wrap font-sans">
              {job.raw_description}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Full Job Description */}
      {activeTab === 'description' && (
        <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-5">
          <h3 className="text-sm font-semibold text-[#F3F4F6] tracking-tight pb-3 border-b border-white/[0.06] mb-4">
            Raw Job Description
          </h3>
          <div className="text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-wrap font-mono p-4 bg-[#0B0F12] border border-white/[0.06] rounded-[6px]">
            {job.raw_description}
          </div>
        </div>
      )}

      {/* Tab: JD Analysis */}
      {activeTab === 'analysis' && (
        <JDAnalysisSection jobId={jobId} analysis={job.analysis} />
      )}

      {/* Tab: Matches */}
      {activeTab === 'matches' && (
        <MatchesSection jobId={jobId} hasAnalysis={Boolean(job.analysis)} />
      )}

      {/* Tab: Resumes */}
      {activeTab === 'resumes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F3F4F6]">Tailored Resume Versions</h3>
          </div>

          {resumesLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : resumes && resumes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="bg-[#10161B] border border-white/[0.08] hover:border-white/[0.16] rounded-[8px] p-4 flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-[#4D9FFF] bg-[#4D9FFF]/10 border border-[#4D9FFF]/20 px-2 py-0.5 rounded-[4px]">
                        v{resume.version_number}
                      </span>
                      <span className="font-medium text-[#F3F4F6] text-xs">
                        {job.company} — {job.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-1.5">
                      Generated {formatDate(resume.created_at)}
                    </p>
                  </div>

                  <Link href={`/resumes/${resume.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      Preview PDF
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-8 text-center">
              <p className="text-xs text-[#9CA3AF]">No resumes generated for this job yet.</p>
              <button
                type="button"
                onClick={() => setActiveTab('matches')}
                className="mt-2 text-xs text-[#4D9FFF] hover:underline cursor-pointer"
              >
                Go to Matches & Tailoring to create a resume
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Application */}
      {activeTab === 'application' && (
        <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-5">
          <h3 className="text-sm font-semibold text-[#F3F4F6] tracking-tight pb-3 border-b border-white/[0.06] mb-4">
            Application Status
          </h3>

          {linkedApplication ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <span className="text-[#6B7280]">Current Status</span>
                <span className="font-semibold text-[#F3F4F6] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-[4px]">
                  ● {linkedApplication.status}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <span className="text-[#6B7280]">Applied Date</span>
                <span className="text-[#F3F4F6]">{formatDate(linkedApplication.applied_at || linkedApplication.created_at)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[#6B7280]">Linked Resume Version</span>
                <Link href={`/resumes/${linkedApplication.resume_version_id}`} className="text-[#4D9FFF] hover:underline">
                  Resume v{linkedApplication.resume_version_id}
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-[#9CA3AF] mb-3">No application record tracked for this job yet.</p>
              <Button
                onClick={() => setIsAppModalOpen(true)}
                disabled={!resumes || resumes.length === 0}
                className="bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" /> Track Application
              </Button>
              {(!resumes || resumes.length === 0) && (
                <p className="text-[11px] text-[#6B7280] mt-2">
                  Generate a resume first to create an application tracking entry.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Job Modal */}
      <JobModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={async (data) => {
          await updateJobMutation.mutateAsync(data);
        }}
        initialData={job}
        isLoading={updateJobMutation.isPending}
      />

      {/* Application Modal */}
      {resumes && (
        <ApplicationModal
          isOpen={isAppModalOpen}
          onClose={() => setIsAppModalOpen(false)}
          onSubmit={async (data) => {
            await createAppMutation.mutateAsync(data);
          }}
          jobs={[job]}
          resumes={resumes}
          preselectedJobId={jobId}
          isLoading={createAppMutation.isPending}
        />
      )}

      {appError && (
        <div className="fixed bottom-4 right-4 z-50 p-3 bg-rose-500 text-white text-xs font-medium rounded-[6px] shadow-lg flex items-center space-x-2">
          <span>{appError}</span>
          <button onClick={() => setAppError(null)} className="ml-2 underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
