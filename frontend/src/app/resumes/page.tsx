'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, ExternalLink, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { getPdfUrl } from '@/lib/api-client';
import { resumeService } from '@/services/resumes';
import { jobService } from '@/services/jobs';
import { Job } from '@/types';

export default function ResumesPage() {
  const { data: resumes, isLoading, isError, error } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeService.getAll(),
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobService.getAll,
  });

  const jobsById = React.useMemo(() => {
    const map = new Map<number, Job>();
    if (jobs) {
      jobs.forEach((j) => map.set(j.id, j));
    }
    return map;
  }, [jobs]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
        Failed to load resumes: {(error as Error)?.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Resume Workspace"
        description="View and download compiled LaTeX PDF resume versions generated for your target jobs."
      />

      {resumes && resumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resumes.map((resume) => {
            const associatedJob = jobsById.get(resume.job_id);

            return (
              <Card key={resume.id} className="hover:border-indigo-400 transition-all flex flex-col justify-between">
                <CardContent className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <Badge variant="default" className="text-xs font-bold mb-1">
                            Version {resume.version_number}
                          </Badge>
                          <h3 className="font-bold text-slate-900 text-base">
                            {associatedJob ? associatedJob.title : `Job #${resume.job_id}`}
                          </h3>
                          <p className="text-xs font-semibold text-indigo-600">
                            {associatedJob ? associatedJob.company : 'Company N/A'}
                          </p>
                        </div>
                      </div>
                      <div>
                        {resume.pdf_available ? (
                          <Badge variant="success" className="text-[10px]">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> PDF Ready
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertCircle className="mr-1 h-3 w-3" /> PDF Failed
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-xs text-slate-500 mt-4">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Generated on {formatDate(resume.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                    {associatedJob && (
                      <Link href={`/jobs/${associatedJob.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs text-slate-600">
                          <ExternalLink className="mr-1 h-3.5 w-3.5" /> View Job
                        </Button>
                      </Link>
                    )}

                    <div className="flex items-center space-x-2 ml-auto">
                      {resume.pdf_available && (
                        <a
                          href={getPdfUrl(resume.id)}
                          download={`resume_v${resume.version_number}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
                          </Button>
                        </a>
                      )}

                      <Link href={`/resumes/${resume.id}`}>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                          Preview Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <FileText className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900">No Resume Versions Generated</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Select a job in your Jobs Workspace and click &quot;Generate Tailored Resume&quot; to build a LaTeX PDF.
          </p>
          <Link href="/jobs">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Go to Jobs Workspace
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
