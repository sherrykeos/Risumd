'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  History,
  ExternalLink,
  FileText,
} from 'lucide-react';

import { StatusBadge } from './StatusBadge';
import { formatDate } from '@/lib/utils';
import { Application, ApplicationStatus } from '@/types';

interface ApplicationTableProps {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: number) => void;
  onViewHistory: (app: Application) => void;
  onQuickStatusChange: (appId: number, newStatus: ApplicationStatus) => void;
}

export function ApplicationTable({
  applications,
  onEdit,
  onDelete,
  onViewHistory,
}: ApplicationTableProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  return (
    <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#F3F4F6]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] font-medium text-[#6B7280]">
              <th className="py-3 px-4 font-medium">Company</th>
              <th className="py-3 px-4 font-medium">Position</th>
              <th className="py-3 px-4 font-medium">Resume</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Applied</th>
              <th className="py-3 px-4 font-medium">Next action</th>
              <th className="py-3 px-4 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {applications.map((app) => {
              const isMenuOpen = openMenuId === app.id;
              const nextAction = app.notes
                ? app.notes.split('\n')[0].slice(0, 32)
                : '—';

              return (
                <tr
                  key={app.id}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Company */}
                  <td className="py-3.5 px-4 font-semibold text-[#F3F4F6] whitespace-nowrap">
                    {app.job?.company || 'Company'}
                  </td>

                  {/* Position */}
                  <td className="py-3.5 px-4 text-[#9CA3AF] group-hover:text-[#F3F4F6] font-medium whitespace-nowrap transition-colors">
                    {app.job?.title || `Job #${app.job_id}`}
                  </td>

                  {/* Resume version */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Link
                      href={`/resumes/${app.resume_version_id}`}
                      className="inline-flex items-center text-xs font-mono text-[#4D9FFF] hover:underline"
                    >
                      <FileText className="mr-1 h-3.5 w-3.5" />
                      v{app.resume_version_id}
                    </Link>
                  </td>

                  {/* Status badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={app.status} />
                  </td>

                  {/* Applied date */}
                  <td className="py-3.5 px-4 text-[#6B7280] whitespace-nowrap">
                    {formatDate(app.applied_at || app.created_at)}
                  </td>

                  {/* Next action */}
                  <td className="py-3.5 px-4 text-[#9CA3AF] whitespace-nowrap truncate max-w-xs">
                    {nextAction}
                  </td>

                  {/* 3 dots action menu */}
                  <td
                    className="py-3.5 px-4 text-right whitespace-nowrap relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-block relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(isMenuOpen ? null : app.id);
                        }}
                        className="p-1 rounded-[4px] text-[#6B7280] hover:text-[#F3F4F6] hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-[#131A20] border border-white/[0.1] rounded-[6px] shadow-xl py-1 z-20 text-left">
                          <button
                            type="button"
                            onClick={() => {
                              onViewHistory(app);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.05] flex items-center cursor-pointer"
                          >
                            <History className="mr-2 h-3.5 w-3.5" /> Audit History
                          </button>
                          {app.job && (
                            <Link
                              href={`/jobs/${app.job.id}`}
                              className="w-full text-left px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.05] flex items-center"
                            >
                              <ExternalLink className="mr-2 h-3.5 w-3.5" /> Open Job
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              onEdit(app);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.05] flex items-center cursor-pointer"
                          >
                            <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(app.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
