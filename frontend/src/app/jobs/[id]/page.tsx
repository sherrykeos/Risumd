'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ExternalLink,
  Sparkles,
  FileText,
  Send,
  CheckCircle2,
  Clock,
} from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { JDAnalysisSection } from '@/components/jobs/JDAnalysisSection';
import { MatchesSection } from '@/components/jobs/MatchesSection';

import { formatDate } from '@/lib/utils';
import { jobService } from '@/services/jobs';
import { resumeService } from '@/services/resumes';
import { applicationService } from '@/services/applications';
import { ApplicationModal } from '@/components/applications/ApplicationModal';
import { ApplicationCreate } from '@/types';

export default function JobDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const jobId = Number(params.id);

  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'matches' | 'resumes'>('overview');
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-xl">
        <h2 className="text-lg font-bold text-rose-800">Job Not Found</h2>
        <p className="text-sm text-rose-600 mt-1">{(error as Error)?.message || 'The specified job could not be retrieved.'}</p>
        <Link href="/jobs">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/jobs" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Jobs
        </Link>
      </div>

      <Header
        title={`${job.title}`}
        description={`${job.company} ${job.location ? `• ${job.location}` : ''}`}
        actions={
          <div className="flex items-center space-x-2">
            {linkedApplication ? (
              <Badge variant="success" className="py-1.5 px-3 text-xs font-bold">
                <Send className="mr-1.5 h-3.5 w-3.5" /> App: {linkedApplication.status}
              </Badge>
            ) : (
              <Button
                onClick={() => setIsAppModalOpen(true)}
                disabled={!resumes || resumes.length === 0}
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <Send className="mr-2 h-4 w-4" /> Create Application
              </Button>
            )}
          </div>
        }
      />

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{job.company}</span>
              <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
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
                    className="inline-flex items-center text-indigo-600 hover:underline"
                  >
                    <ExternalLink className="mr-1 h-3.5 w-3.5" /> Original Posting
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {job.analysis ? (
                <Badge variant="success" className="text-xs py-1 px-3">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> JD Analyzed
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs py-1 px-3">
                  <Clock className="mr-1 h-3.5 w-3.5" /> Pending Analysis
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Raw Job Description
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors flex items-center cursor-pointer ${
            activeTab === 'analysis'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="mr-1.5 h-4 w-4" /> JD Analysis
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors flex items-center cursor-pointer ${
            activeTab === 'matches'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Matches & Tailoring
        </button>
        <button
          onClick={() => setActiveTab('resumes')}
          className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors flex items-center cursor-pointer ${
            activeTab === 'resumes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="mr-1.5 h-4 w-4" /> Generated Resumes ({resumes?.length || 0})
        </button>
      </div>

      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-mono">
              {job.raw_description}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'analysis' && (
        <JDAnalysisSection jobId={jobId} analysis={job.analysis} />
      )}

      {activeTab === 'matches' && (
        <MatchesSection jobId={jobId} hasAnalysis={Boolean(job.analysis)} />
      )}

      {activeTab === 'resumes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Tailored Resume Versions</h3>
          </div>

          {resumesLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : resumes && resumes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumes.map((resume) => (
                <Card key={resume.id} className="hover:border-indigo-400 transition-colors">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default" className="text-xs font-bold">
                          v{resume.version_number}
                        </Badge>
                        <span className="font-bold text-slate-900 text-base">
                          {job.company} — {job.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Generated {formatDate(resume.created_at)}
                      </p>
                    </div>

                    <Link href={`/resumes/${resume.id}`}>
                      <Button variant="outline" size="sm">
                        Preview PDF
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <p className="text-sm text-slate-500">No resumes generated for this job yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Go to the &quot;Matches & Tailoring&quot; tab to generate a tailored resume version.
              </p>
            </Card>
          )}
        </div>
      )}

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
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-rose-600 text-white text-sm font-medium rounded-xl shadow-lg flex items-center space-x-2">
          <span>{appError}</span>
          <button onClick={() => setAppError(null)} className="ml-2 underline text-xs">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
