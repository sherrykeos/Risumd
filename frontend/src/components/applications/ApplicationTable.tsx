'use client';

import React from 'react';
import Link from 'next/link';
import { Edit2, Trash2, History, ExternalLink, FileText } from 'lucide-react';

import { formatDate } from '@/lib/utils';
import { Application, ApplicationStatus } from '@/types';

interface ApplicationTableProps {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: number) => void;
  onViewHistory: (app: Application) => void;
  onQuickStatusChange: (appId: number, newStatus: ApplicationStatus) => void;
}

const STATUS_OPTIONS: ApplicationStatus[] = [
  'DRAFT',
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
];

export function ApplicationTable({
  applications,
  onEdit,
  onDelete,
  onViewHistory,
  onQuickStatusChange,
}: ApplicationTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
          <tr>
            <th className="py-3.5 px-4 font-semibold">Company & Job Title</th>
            <th className="py-3.5 px-4 font-semibold">Status</th>
            <th className="py-3.5 px-4 font-semibold">Applied Date</th>
            <th className="py-3.5 px-4 font-semibold">Resume Version</th>
            <th className="py-3.5 px-4 font-semibold">Notes</th>
            <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {applications.map((app) => (
            <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-4 px-4">
                <div>
                  <div className="font-bold text-slate-900">{app.job?.title || `Job #${app.job_id}`}</div>
                  <div className="text-xs font-medium text-indigo-600">{app.job?.company}</div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center space-x-2">
                  <select
                    value={app.status}
                    onChange={(e) => onQuickStatusChange(app.id, e.target.value as ApplicationStatus)}
                    className="text-xs rounded-lg border border-slate-200 bg-white py-1 px-2 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </td>
              <td className="py-4 px-4 text-xs text-slate-500">
                {formatDate(app.applied_at || app.created_at)}
              </td>
              <td className="py-4 px-4">
                <Link
                  href={`/resumes/${app.resume_version_id}`}
                  className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline"
                >
                  <FileText className="mr-1 h-3.5 w-3.5" /> Resume #{app.resume_version_id}
                </Link>
              </td>
              <td className="py-4 px-4 text-xs text-slate-600 max-w-xs truncate">
                {app.notes || '—'}
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex items-center justify-end space-x-1">
                  <button
                    onClick={() => onViewHistory(app)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="View Status Audit History"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  {app.job && (
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Open Job Posting"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                  <button
                    onClick={() => onEdit(app)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit Application"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(app.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Application"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
