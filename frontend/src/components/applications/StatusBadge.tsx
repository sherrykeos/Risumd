import React from 'react';
import { ApplicationStatus } from '@/types';

interface StatusBadgeProps {
  status: ApplicationStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'APPLIED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <span className="w-1 h-1 rounded-full bg-blue-400 mr-1.5" />
          Applied
        </span>
      );
    case 'INTERVIEW':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <span className="w-1 h-1 rounded-full bg-purple-400 mr-1.5" />
          Interview
        </span>
      );
    case 'OFFER':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1 h-1 rounded-full bg-emerald-400 mr-1.5" />
          Offer
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1 h-1 rounded-full bg-rose-400 mr-1.5" />
          Rejected
        </span>
      );
    case 'SCREENING':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1 h-1 rounded-full bg-amber-400 mr-1.5" />
          Screening
        </span>
      );
    case 'DRAFT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-white/[0.04] text-[#9CA3AF] border border-white/[0.08]">
          <span className="w-1 h-1 rounded-full bg-slate-500 mr-1.5" />
          Draft
        </span>
      );
    case 'WITHDRAWN':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-white/[0.03] text-[#6B7280] border border-white/[0.06]">
          <span className="w-1 h-1 rounded-full bg-slate-600 mr-1.5" />
          Withdrawn
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-white/[0.04] text-[#9CA3AF] border border-white/[0.08]">
          {status}
        </span>
      );
  }
}
