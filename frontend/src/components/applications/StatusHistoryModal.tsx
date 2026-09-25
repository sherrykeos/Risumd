'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '@/lib/utils';
import { Application } from '@/types';
import { Clock } from 'lucide-react';

interface StatusHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
}

export function StatusHistoryModal({
  isOpen,
  onClose,
  application,
}: StatusHistoryModalProps) {
  if (!application) return null;

  const history = application.status_history || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Application Status History"
      description={`Audit timeline for ${application.job?.company || 'Job'} - ${application.job?.title || ''}`}
      maxWidth="md"
    >
      <div className="py-4">
        {history.length > 0 ? (
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
            {history.map((item, idx) => (
              <div key={item.id || idx} className="relative flex items-start space-x-4 pl-8">
                <div className="absolute left-1.5 top-1 h-4 w-4 rounded-full border-2 border-indigo-600 bg-white" />
                <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {item.old_status && (
                        <>
                          <span className="text-xs font-semibold text-slate-500">{item.old_status}</span>
                          <span className="text-xs text-slate-400">→</span>
                        </>
                      )}
                      <StatusBadge status={item.new_status} />
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center">
                      <Clock className="mr-1 h-3 w-3" /> {formatDate(item.changed_at)}
                    </span>
                  </div>
                  {item.note && (
                    <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200">
                      Note: {item.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">No status history records logged yet.</p>
        )}
      </div>
    </Modal>
  );
}
