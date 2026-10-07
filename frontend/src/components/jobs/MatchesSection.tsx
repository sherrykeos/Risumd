'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  FileText,
  AlertCircle,
  RefreshCw,
  FolderKanban,
  Briefcase,
  ShieldCheck,
  Code,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatScore } from '@/lib/utils';
import { jobService } from '@/services/jobs';
import { resumeService } from '@/services/resumes';
import { JobMatchResponse } from '@/types';

interface MatchesSectionProps {
  jobId: number;
  hasAnalysis: boolean;
}

export function MatchesSection({ jobId, hasAnalysis }: MatchesSectionProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [generateError, setGenerateError] = useState<string | null>(null);

  const {
    data: matches,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<JobMatchResponse>({
    queryKey: ['job-matches', jobId],
    queryFn: () => jobService.getMatches(jobId),
    enabled: hasAnalysis,
  });

  const generateResumeMutation = useMutation({
    mutationFn: () => resumeService.generate(jobId),
    onSuccess: (newResume) => {
      queryClient.invalidateQueries({ queryKey: ['job-resumes', jobId] });
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      router.push(`/resumes/${newResume.id}`);
    },
    onError: (err: Error) => {
      setGenerateError(err.message || 'Failed to generate tailored resume.');
    },
  });

  if (!hasAnalysis) {
    return (
      <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-8 text-center">
        <p className="text-xs text-[#9CA3AF]">Career Vault matching pending.</p>
        <p className="text-[11px] text-[#6B7280] max-w-sm mx-auto mt-1">
          Please run &quot;Analyze with AI&quot; first to compute deterministic evidence match rankings.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-[#10161B] border border-rose-500/20 p-5 rounded-[8px] text-center">
        <AlertCircle className="h-5 w-5 text-rose-400 mx-auto mb-2" />
        <p className="text-xs font-medium text-rose-400">
          Failed to load matches: {(error as Error)?.message || 'Unknown error'}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3 text-xs">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry Matching
        </Button>
      </div>
    );
  }

  const hasMatches =
    matches &&
    ((matches.projects?.length || 0) > 0 ||
      (matches.experiences?.length || 0) > 0 ||
      (matches.skills?.length || 0) > 0 ||
      (matches.technologies?.length || 0) > 0 ||
      (matches.achievements?.length || 0) > 0);

  return (
    <div className="space-y-6">
      {/* Evidence Match Header Surface */}
      <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[#F3F4F6] tracking-tight">
            Evidence Match Rankings
          </h3>
          <p className="text-xs text-[#9CA3AF] mt-0.5 max-w-xl">
            Deterministic match scores based on technology alignment and required skills from your Career Vault.
          </p>
        </div>
        <Button
          onClick={() => generateResumeMutation.mutate()}
          isLoading={generateResumeMutation.isPending}
          className="bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs h-8 px-3 shadow-none flex items-center shrink-0"
        >
          <FileText className="mr-1.5 h-3.5 w-3.5" /> Generate Tailored Resume
        </Button>
      </div>

      {generateError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-[6px] text-rose-400 text-xs flex items-center justify-between">
          <span>{generateError}</span>
          <button onClick={() => setGenerateError(null)} className="text-xs underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {hasMatches ? (
        <div className="space-y-6">
          {/* Ranked Projects */}
          {matches.projects && matches.projects.length > 0 && (
            <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-5 space-y-3">
              <h4 className="text-xs font-semibold text-[#F3F4F6] uppercase tracking-wider flex items-center pb-2 border-b border-white/[0.06]">
                <FolderKanban className="mr-2 h-4 w-4 text-[#4D9FFF]" />
                Ranked Projects ({matches.projects.length})
              </h4>
              <div className="space-y-2.5 pt-1">
                {matches.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-[6px] border border-white/[0.06] bg-[#0B0F12]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-semibold text-[#F3F4F6] text-xs md:text-sm">{proj.name}</h5>
                        {proj.role && <p className="text-[11px] text-[#4D9FFF] mt-0.5">{proj.role}</p>}
                      </div>
                      <div className="flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-[#4D9FFF]/10 border border-[#4D9FFF]/20 shrink-0">
                        <span className="text-[10px] text-[#9CA3AF]">Match:</span>
                        <span className="text-xs font-mono font-semibold text-[#4D9FFF]">
                          {formatScore(proj.score)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {proj.matched_technologies.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-[4px] bg-white/[0.04] text-[#9CA3AF] border border-white/[0.06] text-[10px] font-mono">
                          Tech: {t}
                        </span>
                      ))}
                      {proj.matched_skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-[4px] bg-[#4D9FFF]/10 text-[#4D9FFF] border border-[#4D9FFF]/20 text-[10px] font-mono">
                          Skill: {s}
                        </span>
                      ))}
                    </div>

                    {proj.match_breakdown?.reasons && proj.match_breakdown.reasons.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/[0.04] text-[11px] text-[#9CA3AF]">
                        <ul className="list-disc list-inside space-y-0.5">
                          {proj.match_breakdown.reasons.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ranked Work Experience */}
          {matches.experiences && matches.experiences.length > 0 && (
            <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-5 space-y-3">
              <h4 className="text-xs font-semibold text-[#F3F4F6] uppercase tracking-wider flex items-center pb-2 border-b border-white/[0.06]">
                <Briefcase className="mr-2 h-4 w-4 text-[#4D9FFF]" />
                Ranked Work Experience ({matches.experiences.length})
              </h4>
              <div className="space-y-2.5 pt-1">
                {matches.experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-[6px] border border-white/[0.06] bg-[#0B0F12]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-semibold text-[#F3F4F6] text-xs md:text-sm">{exp.role}</h5>
                        <p className="text-[11px] text-[#4D9FFF] mt-0.5">{exp.company}</p>
                      </div>
                      <div className="flex items-center space-x-1 px-2 py-0.5 rounded-[4px] bg-[#4D9FFF]/10 border border-[#4D9FFF]/20 shrink-0">
                        <span className="text-[10px] text-[#9CA3AF]">Match:</span>
                        <span className="text-xs font-mono font-semibold text-[#4D9FFF]">
                          {formatScore(exp.score)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {exp.matched_technologies.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-[4px] bg-white/[0.04] text-[#9CA3AF] border border-white/[0.06] text-[10px] font-mono">
                          Tech: {t}
                        </span>
                      ))}
                      {exp.matched_skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-[4px] bg-[#4D9FFF]/10 text-[#4D9FFF] border border-[#4D9FFF]/20 text-[10px] font-mono">
                          Skill: {s}
                        </span>
                      ))}
                    </div>

                    {exp.match_breakdown?.reasons && exp.match_breakdown.reasons.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/[0.04] text-[11px] text-[#9CA3AF]">
                        <ul className="list-disc list-inside space-y-0.5">
                          {exp.match_breakdown.reasons.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Skills & Technologies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.skills && matches.skills.length > 0 && (
              <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-5 space-y-3">
                <h4 className="text-xs font-semibold text-[#F3F4F6] uppercase tracking-wider flex items-center pb-2 border-b border-white/[0.06]">
                  <ShieldCheck className="mr-2 h-4 w-4 text-emerald-400" />
                  Matched Skills ({matches.skills.length})
                </h4>
                <div className="space-y-1.5">
                  {matches.skills.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-xs p-2 rounded-[5px] bg-[#0B0F12] border border-white/[0.04]"
                    >
                      <span className="font-medium text-[#F3F4F6]">{s.name}</span>
                      <span className="text-[11px] font-mono text-emerald-400">
                        {formatScore(s.score)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matches.technologies && matches.technologies.length > 0 && (
              <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-5 space-y-3">
                <h4 className="text-xs font-semibold text-[#F3F4F6] uppercase tracking-wider flex items-center pb-2 border-b border-white/[0.06]">
                  <Code className="mr-2 h-4 w-4 text-sky-400" />
                  Matched Technologies ({matches.technologies.length})
                </h4>
                <div className="space-y-1.5">
                  {matches.technologies.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between text-xs p-2 rounded-[5px] bg-[#0B0F12] border border-white/[0.04]"
                    >
                      <span className="font-medium text-[#F3F4F6]">{t.name}</span>
                      <span className="text-[11px] font-mono text-sky-400">
                        {formatScore(t.score)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-8 text-center">
          <p className="text-xs text-[#9CA3AF]">No matching evidence items found in Career Vault.</p>
          <p className="text-[11px] text-[#6B7280] mt-1">
            Add relevant projects, work experience, or skills to your Career Vault to see ranked evidence.
          </p>
        </div>
      )}
    </div>
  );
}
