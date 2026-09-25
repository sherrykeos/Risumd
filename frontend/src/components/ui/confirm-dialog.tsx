'use client';

import React from 'react';
import { Modal } from './modal';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'destructive' | 'default';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'destructive',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex flex-col items-center text-center py-2 space-y-4">
        {variant === 'destructive' && (
          <div className="rounded-full bg-rose-100 p-3 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="flex items-center justify-end space-x-3 w-full pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
