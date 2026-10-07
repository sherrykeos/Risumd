'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Minus,
  Plus,
  Maximize2,
  Printer,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getPdfUrl } from '@/lib/api-client';
import { resumeService } from '@/services/resumes';
import { jobService } from '@/services/jobs';

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

export default function ResumePreviewPage() {
  const params = useParams();
  const resumeId = Number(params.id);

  const [zoomLevel, setZoomLevel] = useState<number>(100);

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
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (isError || !resume) {
    return (
      <div className="p-8 text-center bg-[#10161B] border border-white/[0.08] rounded-[8px]">
        <h2 className="text-base font-semibold text-[#F3F4F6]">Resume Not Found</h2>
        <p className="text-xs text-[#9CA3AF] mt-1">
          {(error as Error)?.message || 'The requested resume version does not exist.'}
        </p>
        <Link href="/resumes">
          <Button variant="outline" className="mt-4 text-xs">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Resumes
          </Button>
        </Link>
      </div>
    );
  }

  const pdfUrl = getPdfUrl(resume.id);
  const resumeTitle = job ? `${job.title} Resume` : `Tailored Resume v${resume.version_number}`;
  const resumeSubtitle = `v${resume.version_number} · ${job?.company || 'General'} · Updated ${getRelativeTime(
    resume.created_at
  )}`;

  const rawData = (resume.resume_data || {}) as Record<string, any>;
  const contact = (rawData.contact || {}) as Record<string, string | undefined>;
  const summary = rawData.summary as string | undefined;
  const experiences = (rawData.experiences || []) as Array<any>;
  const education = (rawData.education || []) as Array<any>;
  const projects = (rawData.projects || []) as Array<any>;
  const skills = (rawData.skills || []) as Array<any>;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 70));

  return (
    <div className="space-y-5">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/resumes"
          className="inline-flex items-center text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Resumes
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#F3F4F6]">
            {resumeTitle}
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            {resumeSubtitle}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {resume.pdf_available && (
            <a
              href={pdfUrl}
              download={`resume_v${resume.version_number}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="text-xs h-8 px-3">
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
              </Button>
            </a>
          )}

          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <Button className="bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs h-8 px-3 shadow-none flex items-center">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Open in new tab
            </Button>
          </a>
        </div>
      </div>

      {/* Document Viewer Container */}
      <div className="rounded-[8px] overflow-hidden border border-white/[0.08] flex flex-col">
        {/* Viewer Toolbar */}
        <div className="h-10 px-4 bg-[#10161B] border-b border-white/[0.08] flex items-center justify-between text-xs text-[#9CA3AF]">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1 rounded text-[#6B7280] hover:text-[#F3F4F6] transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Zoom & Page navigation */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.05] transition-colors cursor-pointer"
              title="Zoom out"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-[11px] text-[#F3F4F6] select-none w-10 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.05] transition-colors cursor-pointer"
              title="Zoom in"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>

            <span className="text-white/20">|</span>

            <span className="font-mono text-[11px] text-[#9CA3AF] select-none">
              1 / 1
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="p-1 rounded text-[#6B7280] hover:text-[#F3F4F6] transition-colors cursor-pointer"
              title="Print document"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Deep Dark Document Canvas */}
        <div className="bg-[#0B0F12] p-6 md:p-10 flex justify-center items-start overflow-auto min-h-[750px]">
          {/* THE RESUME ITSELF: A CRISP WHITE SHEET with sharp black text! */}
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="transition-transform duration-150"
          >
            {resume.pdf_available ? (
              <div className="w-[794px] min-h-[1123px] bg-white rounded-[2px] shadow-2xl overflow-hidden relative border border-slate-200">
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-[1123px] border-0"
                  title={`Resume v${resume.version_number}`}
                />
              </div>
            ) : (
              /* High-fidelity Crisp White Printable Resume Sheet Fallback */
              <div className="w-[794px] min-h-[1123px] bg-white text-slate-900 rounded-[2px] shadow-2xl p-12 space-y-6 font-sans text-left border border-slate-200">
                {/* Header Name & Contact */}
                <div className="text-center border-b border-slate-300 pb-4">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                    {contact.name || 'Sharad Kumar'}
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 space-x-2">
                    <span>{contact.email || 'sharad@example.com'}</span>
                    <span>•</span>
                    <span>{contact.phone || '+91 98765 43210'}</span>
                    <span>•</span>
                    <span>{contact.location || 'Bengaluru, India'}</span>
                  </p>
                  {(contact.linkedin || contact.github) && (
                    <p className="text-xs text-slate-500 mt-0.5 space-x-2">
                      {contact.linkedin && <span>linkedin.com/in/{contact.linkedin}</span>}
                      {contact.linkedin && contact.github && <span>•</span>}
                      {contact.github && <span>github.com/{contact.github}</span>}
                    </p>
                  )}
                </div>

                {/* Summary */}
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                    Summary
                  </h2>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {summary ||
                      'Software engineer with experience building scalable backend systems. Strong foundation in distributed systems, data structures, and modern web technologies. Passionate about building products that solve real-world problems.'}
                  </p>
                </div>

                {/* Experience */}
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                    Experience
                  </h2>
                  <div className="space-y-4">
                    {experiences.length > 0 ? (
                      experiences.map((exp: any, i: number) => (
                        <div key={i} className="text-xs">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>{exp.role}</span>
                            <span className="text-slate-600 font-normal">{exp.location || 'Bengaluru, India'}</span>
                          </div>
                          <div className="flex justify-between text-slate-700 italic">
                            <span>{exp.company}</span>
                            <span className="font-normal not-italic text-slate-500">
                              {exp.start_date} - {exp.end_date || 'Present'}
                            </span>
                          </div>
                          {exp.description && (
                            <p className="mt-1 text-slate-700 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="text-xs">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>Software Engineer</span>
                            <span className="text-slate-600 font-normal">Bengaluru, India</span>
                          </div>
                          <div className="flex justify-between text-slate-700 italic">
                            <span>Google</span>
                            <span className="font-normal not-italic text-slate-500">Jan 2023 — Present</span>
                          </div>
                          <ul className="list-disc list-inside mt-1 text-slate-700 space-y-0.5">
                            <li>Designed and developed scalable backend systems using Python and Go.</li>
                            <li>Improved system performance by 40% through optimized data pipelines.</li>
                            <li>Worked on distributed systems serving millions of users.</li>
                          </ul>
                        </div>
                        <div className="text-xs">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>SDE Intern</span>
                            <span className="text-slate-600 font-normal">Remote</span>
                          </div>
                          <div className="flex justify-between text-slate-700 italic">
                            <span>Microsoft</span>
                            <span className="font-normal not-italic text-slate-500">May 2022 — Aug 2022</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                    Projects
                  </h2>
                  <div className="space-y-3">
                    {projects.length > 0 ? (
                      projects.map((proj: any, i: number) => (
                        <div key={i} className="text-xs">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>{proj.name}</span>
                            <span className="text-slate-500 font-normal">
                              {proj.technologies?.join(', ')}
                            </span>
                          </div>
                          <p className="mt-0.5 text-slate-700 leading-relaxed">{proj.description}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>Smart Home Energy Monitor</span>
                          <span className="text-slate-500 font-normal">ESP32, React, IoT, Blynk</span>
                        </div>
                        <p className="mt-0.5 text-slate-700 leading-relaxed">
                          IoT-based energy monitoring system with real-time analytics and remote control.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                    Skills & Technologies
                  </h2>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <span className="font-semibold">Languages & Frameworks: </span>
                    Python, Go, JavaScript, TypeScript, React, Next.js, FastAPI, PostgreSQL, Docker, GCP
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
