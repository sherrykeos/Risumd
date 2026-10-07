'use client';

import React from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Application, ApplicationStatus } from '@/types';
import { FileText, History, Edit2, Trash2 } from 'lucide-react';

interface ApplicationKanbanProps {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: number) => void;
  onViewHistory: (app: Application) => void;
}

const COLUMNS: { status: ApplicationStatus; title: string }[] = [
  { status: 'DRAFT', title: 'Draft' },
  { status: 'APPLIED', title: 'Applied' },
  { status: 'SCREENING', title: 'Screening' },
  { status: 'INTERVIEW', title: 'Interview' },
  { status: 'OFFER', title: 'Offer' },
  { status: 'REJECTED', title: 'Rejected' },
];

export function ApplicationKanban({
  applications,
  onEdit,
  onDelete,
  onViewHistory,
}: ApplicationKanbanProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colApps = applications.filter((a) => a.status === col.status);

        return (
          <div
            key={col.status}
            className="bg-[#10161B] p-3 rounded-[8px] border border-white/[0.08] flex flex-col min-w-[220px]"
          >
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.06]">
              <h3 className="font-semibold text-[#F3F4F6] text-xs uppercase tracking-wider">
                {col.title}
              </h3>
              <span className="text-[11px] font-mono text-[#9CA3AF] bg-[#0B0F12] px-2 py-0.5 rounded-[4px] border border-white/[0.06]">
                {colApps.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh]">
              {colApps.map((app) => (
                <div
                  key={app.id}
                  className="bg-[#0B0F12] border border-white/[0.06] hover:border-white/[0.12] rounded-[6px] p-3 space-y-2 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold text-[#F3F4F6] text-xs line-clamp-1">
                      {app.job?.title || `Job #${app.job_id}`}
                    </h4>
                    <p className="text-[11px] text-[#4D9FFF] mt-0.5">
                      {app.job?.company}
                    </p>
                  </div>

                  <p className="text-[10px] text-[#6B7280]">
                    Applied: {formatDate(app.applied_at || app.created_at)}
                  </p>

                  {app.notes && (
                    <p className="text-[11px] text-[#9CA3AF] bg-white/[0.02] p-1.5 rounded-[4px] border border-white/[0.04] line-clamp-2 italic">
                      &quot;{app.notes}&quot;
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                    <Link
                      href={`/resumes/${app.resume_version_id}`}
                      className="text-[11px] font-mono text-[#4D9FFF] hover:underline flex items-center"
                    >
                      <FileText className="mr-1 h-3 w-3" /> v{app.resume_version_id}
                    </Link>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onViewHistory(app)}
                        className="p-1 text-[#6B7280] hover:text-[#F3F4F6] cursor-pointer"
                        title="Audit History"
                      >
                        <History className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onEdit(app)}
                        className="p-1 text-[#6B7280] hover:text-[#F3F4F6] cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onDelete(app.id)}
                        className="p-1 text-[#6B7280] hover:text-rose-400 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {colApps.length === 0 && (
                <div className="py-6 text-center text-xs text-[#6B7280] italic">
                  No applications
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
