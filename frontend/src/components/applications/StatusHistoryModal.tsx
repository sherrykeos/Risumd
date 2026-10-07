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
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-px before:bg-white/[0.08]">
            {history.map((item, idx) => (
              <div key={item.id || idx} className="relative flex items-start space-x-4 pl-8">
                <div className="absolute left-2 top-1.5 h-3 w-3 rounded-full border-2 border-[#4D9FFF] bg-[#0B0F12]" />
                <div className="flex-1 bg-[#0B0F12] p-3 rounded-[6px] border border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {item.old_status && (
                        <>
                          <span className="text-xs font-medium text-[#9CA3AF]">{item.old_status}</span>
                          <span className="text-xs text-[#6B7280]">→</span>
                        </>
                      )}
                      <StatusBadge status={item.new_status} />
                    </div>
                    <span className="text-[11px] text-[#6B7280] flex items-center font-mono">
                      <Clock className="mr-1 h-3 w-3" /> {formatDate(item.changed_at)}
                    </span>
                  </div>
                  {item.note && (
                    <p className="text-xs text-[#9CA3AF] mt-2 pt-2 border-t border-white/[0.06]">
                      Note: {item.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6B7280] text-center py-4">No status history records logged yet.</p>
        )}
      </div>
    </Modal>
  );
}
