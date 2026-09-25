'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Target,
  FileText,
  AlertCircle,
  RefreshCw,
  FolderKanban,
  Briefcase,
  ShieldCheck,
  Code,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      <Card>
        <CardContent className="p-8 text-center">
          <Target className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900">Career Vault Matching Pending</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Please run &quot;Analyze with AI&quot; first to compute deterministic evidence match rankings.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-rose-200 bg-rose-50/30">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-6 w-6 text-rose-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-rose-800">
            Failed to load matches: {(error as Error)?.message || 'Unknown error'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry Matching
          </Button>
        </CardContent>
      </Card>
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
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/30">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <Target className="mr-2 h-5 w-5 text-indigo-600" /> Evidence Match Rankings
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              Deterministic match scores based on technology alignment, required skills, and keyword occurrences in your Career Vault.
            </p>
          </div>
          <Button
            onClick={() => generateResumeMutation.mutate()}
            isLoading={generateResumeMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
          >
            <FileText className="mr-2 h-4 w-4" /> Generate Tailored Resume
          </Button>
        </CardContent>
      </Card>

      {generateError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
          <span>{generateError}</span>
          <button onClick={() => setGenerateError(null)} className="text-xs underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {hasMatches ? (
        <div className="space-y-6">
          {matches.projects && matches.projects.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <FolderKanban className="mr-2 h-4 w-4 text-indigo-600" />
                  Ranked Projects ({matches.projects.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {matches.projects.map((proj) => (
                  <div key={proj.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{proj.name}</h4>
                        {proj.role && <p className="text-xs font-medium text-indigo-600">{proj.role}</p>}
                      </div>
                      <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        <span className="text-xs font-semibold text-slate-500">Match Score:</span>
                        <span className="text-sm font-bold text-indigo-700">{formatScore(proj.score)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {proj.matched_technologies.map((t, idx) => (
                        <Badge key={idx} variant="info" className="text-[10px]">
                          Tech: {t}
                        </Badge>
                      ))}
                      {proj.matched_skills.map((s, idx) => (
                        <Badge key={idx} variant="default" className="text-[10px]">
                          Skill: {s}
                        </Badge>
                      ))}
                    </div>

                    {proj.match_breakdown?.reasons && proj.match_breakdown.reasons.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Match reasons:</span>
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                          {proj.match_breakdown.reasons.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {matches.experiences && matches.experiences.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Briefcase className="mr-2 h-4 w-4 text-indigo-600" />
                  Ranked Work Experience ({matches.experiences.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {matches.experiences.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{exp.role}</h4>
                        <p className="text-xs font-semibold text-indigo-600">{exp.company}</p>
                      </div>
                      <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        <span className="text-xs font-semibold text-slate-500">Match Score:</span>
                        <span className="text-sm font-bold text-indigo-700">{formatScore(exp.score)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {exp.matched_technologies.map((t, idx) => (
                        <Badge key={idx} variant="info" className="text-[10px]">
                          Tech: {t}
                        </Badge>
                      ))}
                      {exp.matched_skills.map((s, idx) => (
                        <Badge key={idx} variant="default" className="text-[10px]">
                          Skill: {s}
                        </Badge>
                      ))}
                    </div>

                    {exp.match_breakdown?.reasons && exp.match_breakdown.reasons.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Match reasons:</span>
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                          {exp.match_breakdown.reasons.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.skills && matches.skills.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" />
                    Matched Skills ({matches.skills.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {matches.skills.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="font-semibold text-slate-800">{s.name}</span>
                        <Badge variant="success" className="text-[10px]">
                          {formatScore(s.score)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {matches.technologies && matches.technologies.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Code className="mr-2 h-4 w-4 text-sky-600" />
                    Matched Technologies ({matches.technologies.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {matches.technologies.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="font-semibold text-slate-800">{t.name}</span>
                        <Badge variant="info" className="text-[10px]">
                          {formatScore(t.score)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-slate-500">No matching evidence items found in Career Vault.</p>
          <p className="text-xs text-slate-400 mt-1">
            Add relevant projects, work experience, or skills to your Career Vault to see ranked evidence.
          </p>
        </Card>
      )}
    </div>
  );
}
