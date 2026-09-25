'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  AlertCircle,
  Briefcase,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Link2,
} from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { getPdfUrl } from '@/lib/api-client';
import { resumeService } from '@/services/resumes';
import { jobService } from '@/services/jobs';

export default function ResumePreviewPage() {
  const params = useParams();
  const resumeId = Number(params.id);

  const { data: resume, isLoading, isError, error } = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => resumeService.getById(resumeId),
    enabled: Boolean(resumeId),
  });

  const { data: job } = useQuery({
    queryKey: ['job', resume?.job_id],
    queryFn: () => (resume?.job_id ? jobService.getById(resume.job_id) : null),
    enabled: Boolean(resume?.job_id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !resume) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-xl">
        <h2 className="text-lg font-bold text-rose-800">Resume Version Not Found</h2>
        <p className="text-sm text-rose-600 mt-1">{(error as Error)?.message || 'The requested resume version does not exist.'}</p>
        <Link href="/resumes">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Resumes
          </Button>
        </Link>
      </div>
    );
  }

  const pdfUrl = getPdfUrl(resume.id);
  const data = (resume.resume_data || {}) as Record<string, unknown>;
  const contact = (data.contact || {}) as Record<string, string | undefined>;

  return (
    <div>
      <div className="mb-4">
        <Link href="/resumes" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-600">
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Resumes
        </Link>
      </div>

      <Header
        title={`Resume Version ${resume.version_number}`}
        description={`Tailored for ${job ? `${job.company} — ${job.title}` : `Job #${resume.job_id}`}`}
        actions={
          <div className="flex items-center space-x-2">
            {job && (
              <Link href={`/jobs/${job.id}`}>
                <Button variant="outline">
                  <Briefcase className="mr-2 h-4 w-4" /> View Associated Job
                </Button>
              </Link>
            )}

            {resume.pdf_available && (
              <a
                href={pdfUrl}
                download={`resume_v${resume.version_number}.pdf`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
              </a>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Version Metadata</CardTitle>
                <Badge variant={resume.pdf_available ? 'success' : 'destructive'}>
                  {resume.pdf_available ? 'PDF Compiled' : 'Compilation Issue'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Version ID</span>
                <span className="font-semibold text-slate-800">#{resume.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Version Number</span>
                <span className="font-semibold text-slate-800">v{resume.version_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Target Job</span>
                <span className="font-semibold text-indigo-600">{job ? `${job.company} - ${job.title}` : `Job #${resume.job_id}`}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Generated Date</span>
                <span className="font-semibold text-slate-800">{formatDate(resume.created_at)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-slate-800">Immutable Snapshot</span>
              </div>
            </CardContent>
          </Card>

          {data && Object.keys(data).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Candidate Contact & Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {contact.name && (
                  <div className="flex items-center space-x-2 font-bold text-slate-900 text-base">
                    <User className="h-4 w-4 text-indigo-600" />
                    <span>{contact.name}</span>
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-slate-600">
                  {contact.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{contact.location}</span>
                    </div>
                  )}
                  {contact.github && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-3.5 w-3.5 text-slate-400" />
                      <span>{contact.github}</span>
                    </div>
                  )}
                  {contact.linkedin && (
                    <div className="flex items-center space-x-2">
                      <Link2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>{contact.linkedin}</span>
                    </div>
                  )}
                </div>

                {typeof data.summary === 'string' && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Professional Summary
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {data.summary}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col min-h-[600px]">
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100">
              <CardTitle className="text-base flex items-center">
                <FileText className="mr-2 h-4 w-4 text-indigo-600" /> PDF Document Preview
              </CardTitle>
              {resume.pdf_available && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="text-xs">
                    <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open in New Tab
                  </Button>
                </a>
              )}
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col bg-slate-100 rounded-b-xl overflow-hidden">
              {resume.pdf_available ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full min-h-[650px] border-0"
                  title={`Resume v${resume.version_number} Preview`}
                />
              ) : (
                <div className="p-12 text-center my-auto">
                  <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-900 text-lg">PDF Compilation Unavailable</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    The PDF binary for this resume version was not compiled or Tectonic LaTeX renderer was unavailable.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
