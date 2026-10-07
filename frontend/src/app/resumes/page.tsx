'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Download,
  ExternalLink,
  FileText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { getPdfUrl } from '@/lib/api-client';
import { resumeService } from '@/services/resumes';
import { jobService } from '@/services/jobs';
import { Job } from '@/types';

function getRelativeTime(dateString?: string): string {
  if (!dateString) return 'recently';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs)) return 'recently';
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay === 1) return '1 day ago';
  if (diffDay < 30) return `${diffDay} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ResumesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: resumes, isLoading, isError, error } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeService.getAll(),
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobService.getAll,
  });

  const jobsById = useMemo(() => {
    const map = new Map<number, Job>();
    if (jobs) {
      jobs.forEach((j) => map.set(j.id, j));
    }
    return map;
  }, [jobs]);

  const filteredResumes = useMemo(() => {
    if (!resumes) return [];
    return resumes.filter((r) => {
      const associatedJob = jobsById.get(r.job_id);
      const q = searchQuery.toLowerCase();
      const jobTitle = associatedJob?.title.toLowerCase() || '';
      const company = associatedJob?.company.toLowerCase() || '';
      const vNum = `v${r.version_number}`;
      return (
        jobTitle.includes(q) ||
        company.includes(q) ||
        vNum.includes(q)
      );
    });
  }, [resumes, jobsById, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#F3F4F6]">
            Resumes
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-0.5">
            Manage your tailored resume versions.
          </p>
        </div>

        {/* Right side: Search + New resume */}
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search resumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-44 sm:w-56 rounded-[6px] border border-white/[0.08] bg-[#10161B] pl-8 pr-3 text-xs text-[#F3F4F6] placeholder:text-[#6B7280] focus:border-[#4D9FFF]/60 focus:outline-hidden focus:ring-1 focus:ring-[#4D9FFF]/30 transition-colors"
            />
          </div>

          <Link href="/jobs">
            <Button className="bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs font-medium h-8 px-3 rounded-[6px] shadow-none flex items-center">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New resume
            </Button>
          </Link>
        </div>
      </div>

      {/* Resumes Clean Table */}
      {isLoading ? (
        <div className="space-y-2 p-4 bg-[#10161B] border border-white/[0.08] rounded-[8px]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-[8px] text-rose-400 text-xs">
          Failed to load resumes: {(error as Error)?.message || 'Unknown error'}
        </div>
      ) : filteredResumes && filteredResumes.length > 0 ? (
        <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#F3F4F6]">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] font-medium text-[#6B7280]">
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Job</th>
                  <th className="py-3 px-4 font-medium">Version</th>
                  <th className="py-3 px-4 font-medium">Updated</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredResumes.map((resume) => {
                  const associatedJob = jobsById.get(resume.job_id);
                  const resumeName = associatedJob
                    ? `${associatedJob.title} Resume`
                    : `Tailored Resume #${resume.id}`;

                  return (
                    <tr
                      key={resume.id}
                      onClick={() => router.push(`/resumes/${resume.id}`)}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 font-semibold text-[#F3F4F6] whitespace-nowrap">
                        <div className="flex items-center space-x-2.5">
                          <FileText className="h-4 w-4 text-[#4D9FFF] shrink-0" />
                          <span>{resumeName}</span>
                        </div>
                      </td>

                      {/* Job */}
                      <td className="py-3.5 px-4 text-[#9CA3AF] whitespace-nowrap">
                        {associatedJob ? associatedJob.company : '—'}
                      </td>

                      {/* Version */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-[#4D9FFF] bg-[#4D9FFF]/10 border border-[#4D9FFF]/20 px-2 py-0.5 rounded-[4px]">
                          v{resume.version_number}
                        </span>
                      </td>

                      {/* Updated */}
                      <td className="py-3.5 px-4 text-[#6B7280] whitespace-nowrap">
                        {getRelativeTime(resume.created_at)}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end space-x-2">
                          {resume.pdf_available && (
                            <a
                              href={getPdfUrl(resume.id)}
                              download={`resume_v${resume.version_number}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-[5px] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.05] transition-colors"
                              title="Download PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}

                          <Link href={`/resumes/${resume.id}`}>
                            <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
                              Preview
                            </Button>
                          </Link>
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
          <p className="text-xs text-[#9CA3AF]">No resume versions created yet.</p>
          <p className="text-[11px] text-[#6B7280] mt-1 mb-3">
            Target a job posting and generate a tailored resume version.
          </p>
          <Link href="/jobs">
            <Button className="bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs">
              Go to Jobs Workspace
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
