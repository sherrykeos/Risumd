'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, AlertCircle, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
      setErrorMsg(err.message || 'Job description analysis failed. Please verify API configuration.');
    },
  });

  return (
    <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-5 space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-[#F3F4F6] tracking-tight">
            JD Analysis
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Structured analysis of seniority, required proficiencies, and responsibilities.
          </p>
        </div>

        <Button
          onClick={() => generateMutation.mutate()}
          isLoading={generateMutation.isPending}
          variant={analysis ? 'outline' : 'default'}
          className={
            analysis
              ? 'text-xs h-8 px-3'
              : 'bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs h-8 px-3 shadow-none'
          }
        >
          {analysis ? (
            <>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Regenerate Analysis
            </>
          ) : (
            <>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Analyze with AI
            </>
          )}
        </Button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-[6px] text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {analysis ? (
        <div className="space-y-6">
          {/* Analysis Summary Surface */}
          <div className="bg-[#0B0F12] border border-white/[0.06] rounded-[6px] p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {analysis.seniority && (
                <div className="text-xs">
                  <span className="text-[#6B7280] text-[11px] block">Seniority</span>
                  <span className="text-[#F3F4F6] font-medium">{analysis.seniority}</span>
                </div>
              )}
              {analysis.domain && (
                <div className="text-xs">
                  <span className="text-[#6B7280] text-[11px] block">Domain</span>
                  <span className="text-[#F3F4F6] font-medium">{analysis.domain}</span>
                </div>
              )}
            </div>

            {analysis.summary && (
              <div className="pt-2 border-t border-white/[0.04]">
                <span className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider block mb-1">
                  Analysis summary
                </span>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            )}
          </div>

          {/* Grid: Required Skills, Preferred Skills, Technologies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Required skills */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[#F3F4F6] uppercase tracking-wider">
                Required skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {analysis.required_skills && analysis.required_skills.length > 0 ? (
                  analysis.required_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-[4px] bg-white/[0.04] text-[#F3F4F6] border border-white/[0.08] text-xs font-mono"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#6B7280]">None specified</span>
                )}
              </div>
            </div>

            {/* Preferred skills */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[#F3F4F6] uppercase tracking-wider">
                Preferred skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {analysis.preferred_skills && analysis.preferred_skills.length > 0 ? (
                  analysis.preferred_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-[4px] bg-white/[0.04] text-[#9CA3AF] border border-white/[0.08] text-xs font-mono"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#6B7280]">None specified</span>
                )}
              </div>
            </div>

            {/* Technologies */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[#F3F4F6] uppercase tracking-wider">
                Technologies
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {analysis.technologies && analysis.technologies.length > 0 ? (
                  analysis.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-[4px] bg-[#4D9FFF]/10 text-[#4D9FFF] border border-[#4D9FFF]/20 text-xs font-mono"
                    >
                      {tech}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#6B7280]">None specified</span>
                )}
              </div>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[#F3F4F6] uppercase tracking-wider">
                Keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {analysis.keywords && analysis.keywords.length > 0 ? (
                  analysis.keywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-[4px] bg-white/[0.03] text-[#9CA3AF] border border-white/[0.06] text-xs font-mono"
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#6B7280]">None specified</span>
                )}
              </div>
            </div>
          </div>

          {/* Responsibilities */}
          {analysis.responsibilities && analysis.responsibilities.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <h3 className="text-xs font-semibold text-[#F3F4F6] uppercase tracking-wider">
                Responsibilities
              </h3>
              <ul className="space-y-1.5 text-xs text-[#9CA3AF] leading-relaxed">
                {analysis.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-[#6B7280] select-none shrink-0">•</span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xs text-[#9CA3AF] mb-1">No JD analysis generated yet.</p>
          <p className="text-[11px] text-[#6B7280] max-w-sm mx-auto mb-4">
            Extract required skills, technologies, and qualifications to enable evidence matching.
          </p>
          <Button
            onClick={() => generateMutation.mutate()}
            isLoading={generateMutation.isPending}
            className="bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs h-8 px-4 shadow-none"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Analyze Job Description
          </Button>
        </div>
      )}
    </div>
  );
}
