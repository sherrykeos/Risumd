'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colApps = applications.filter((a) => a.status === col.status);

        return (
          <div key={col.status} className="bg-slate-100/70 p-3 rounded-xl border border-slate-200/80 flex flex-col min-w-[240px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">{col.title}</h3>
              <span className="text-xs font-semibold bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                {colApps.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh]">
              {colApps.map((app) => (
                <Card key={app.id} className="hover:border-indigo-400 transition-all bg-white shadow-2xs">
                  <CardContent className="p-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{app.job?.title || `Job #${app.job_id}`}</h4>
                        <p className="text-xs font-semibold text-indigo-600">{app.job?.company}</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Applied: {formatDate(app.applied_at || app.created_at)}
                    </p>

                    {app.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md line-clamp-2 italic">
                        &quot;{app.notes}&quot;
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <Link
                        href={`/resumes/${app.resume_version_id}`}
                        className="text-[11px] font-medium text-indigo-600 hover:underline flex items-center"
                      >
                        <FileText className="mr-1 h-3 w-3" /> v{app.resume_version_id}
                      </Link>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onViewHistory(app)}
                          className="p-1 text-slate-400 hover:text-indigo-600"
                          title="Audit History"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(app)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(app.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {colApps.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400 italic">
                  No applications in {col.title}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
