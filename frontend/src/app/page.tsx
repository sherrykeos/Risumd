'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Send,
  CalendarCheck,
  Trophy,
  FileText,
  Plus,
  ArrowRight,
  FolderKanban,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

import { jobService } from '@/services/jobs';
import { applicationService } from '@/services/applications';
import { resumeService } from '@/services/resumes';
import { projectService } from '@/services/career-vault';

export default function DashboardPage() {
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobService.getAll,
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: applicationService.getAll,
  });

  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeService.getAll(),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  const isLoading = jobsLoading || appsLoading || resumesLoading || projectsLoading;

  // Stats calculation
  const totalJobs = jobs?.length || 0;
  const totalApps = applications?.length || 0;
  const interviews = applications?.filter((a) => a.status === 'INTERVIEW').length || 0;
  const offers = applications?.filter((a) => a.status === 'OFFER').length || 0;
  const totalResumes = resumes?.length || 0;

  const isEmptyState =
    !isLoading && totalJobs === 0 && (projects?.length || 0) === 0 && totalApps === 0;

  return (
    <div>
      <Header
        title="Dashboard"
        description="Overview of your career vault, job applications, and generated resume versions."
        actions={
          <div className="flex items-center space-x-2">
            <Link href="/jobs">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" /> Add Job
              </Button>
            </Link>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="border-l-4 border-l-indigo-600">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Jobs
            </CardTitle>
            <Briefcase className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">{totalJobs}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sky-600">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Applications
            </CardTitle>
            <Send className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">{totalApps}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Interviews
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">{interviews}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Offers
            </CardTitle>
            <Trophy className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">{offers}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Resumes Generated
            </CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">{totalResumes}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty State Banner if new user */}
      {isEmptyState && (
        <Card className="mb-8 border-indigo-200 bg-indigo-50/50 p-6 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-indigo-700 font-semibold">
              <Sparkles className="h-5 w-5" />
              <span>Welcome to Risumd!</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Get started by populating your Career Vault or adding your first target job.
            </h3>
            <p className="text-sm text-slate-600 max-w-2xl">
              Add your projects, experience, skills, and achievements to the Career Vault, then match against job descriptions to generate tailored resumes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/career-vault">
              <Button variant="outline" className="w-full sm:w-auto border-indigo-300 text-indigo-700 hover:bg-indigo-100">
                <FolderKanban className="mr-2 h-4 w-4" /> Career Vault
              </Button>
            </Link>
            <Link href="/jobs">
              <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" /> Add First Job
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Actions & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Shortcut to common workspace tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/jobs" className="block">
              <div className="p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Add a Job</h4>
                    <p className="text-xs text-slate-500">Target posting for JD analysis</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
              </div>
            </Link>

            <Link href="/career-vault" className="block">
              <div className="p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Populate Career Vault</h4>
                    <p className="text-xs text-slate-500">Manage projects & experiences</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
              </div>
            </Link>

            <Link href="/resumes" className="block">
              <div className="p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">View Resumes</h4>
                    <p className="text-xs text-slate-500">Browse generated PDF versions</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
              </div>
            </Link>

            <Link href="/applications" className="block">
              <div className="p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-md bg-sky-100 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Send className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Track Applications</h4>
                    <p className="text-xs text-slate-500">Update status & history</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Jobs & Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Jobs & Activity</CardTitle>
              <CardDescription>Latest job postings and analysis status</CardDescription>
            </div>
            <Link href="/jobs">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-medium text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {job.title}
                      </Link>
                      <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                        <span className="font-medium text-slate-700">{job.company}</span>
                        {job.location && <span>• {job.location}</span>}
                        <span>• Added {formatDate(job.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {job.analysis ? (
                        <Badge variant="success" className="text-[10px]">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Analyzed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          <Clock className="mr-1 h-3 w-3" /> Pending Analysis
                        </Badge>
                      )}
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                No jobs added yet. Click &quot;Add Job&quot; to begin.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
