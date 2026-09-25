'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JDAnalysis } from '@/types';
import { jobService } from '@/services/jobs';

interface JDAnalysisSectionProps {
  jobId: number;
  analysis?: JDAnalysis | null;
}

export function JDAnalysisSection({ jobId, analysis }: JDAnalysisSectionProps) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: () => jobService.generateAnalysis(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-matches', jobId] });
      setErrorMsg(null);
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'Gemini AI analysis failed. Please verify API configuration.');
    },
  });

  return (
    <Card className="border-indigo-100">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center text-lg">
            <Sparkles className="mr-2 h-5 w-5 text-indigo-600" />
            Structured JD Analysis
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Gemini-extracted seniority, domain, required/preferred skills, and responsibilities.
          </p>
        </div>
        <Button
          onClick={() => generateMutation.mutate()}
          isLoading={generateMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {analysis ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Regenerate Analysis
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" /> Analyze with AI
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent>
        {errorMsg && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {analysis ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Seniority Level
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {analysis.seniority || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Functional Domain
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {analysis.domain || 'Not specified'}
                </span>
              </div>
              {analysis.summary && (
                <div className="md:col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Role Summary
                  </span>
                  <p className="text-sm text-slate-700">{analysis.summary}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-1.5" />
                  Required Skills ({analysis.required_skills?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.required_skills && analysis.required_skills.length > 0 ? (
                    analysis.required_skills.map((skill, idx) => (
                      <Badge key={idx} variant="default" className="text-xs">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None specified</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Preferred / Nice-to-have Skills ({analysis.preferred_skills?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.preferred_skills && analysis.preferred_skills.length > 0 ? (
                    analysis.preferred_skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None specified</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Technologies & Frameworks ({analysis.technologies?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.technologies && analysis.technologies.length > 0 ? (
                    analysis.technologies.map((tech, idx) => (
                      <Badge key={idx} variant="info" className="text-xs">
                        {tech}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None specified</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Keywords ({analysis.keywords?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.keywords && analysis.keywords.length > 0 ? (
                    analysis.keywords.map((kw, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {kw}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None specified</span>
                  )}
                </div>
              </div>
            </div>

            {analysis.responsibilities && analysis.responsibilities.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Key Responsibilities
                </h4>
                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {analysis.responsibilities.map((resp, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <Sparkles className="h-8 w-8 text-indigo-400 mx-auto mb-2 animate-bounce" />
            <h4 className="font-semibold text-slate-900">No JD Analysis Generated Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Run Gemini AI analysis to extract required skills, domain parameters, and unlock deterministic Career Vault matching.
            </p>
            <Button
              onClick={() => generateMutation.mutate()}
              isLoading={generateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Sparkles className="mr-2 h-4 w-4" /> Analyze Job Posting Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
