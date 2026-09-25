'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Achievement, AchievementCreate } from '@/types';

const achievementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  date: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

type AchievementFormData = z.infer<typeof achievementSchema>;

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AchievementCreate) => Promise<void>;
  initialData?: Achievement | null;
  isLoading?: boolean;
}

export function AchievementModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: AchievementModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AchievementFormData>({
    resolver: zodResolver(achievementSchema),
    defaultValues: {
      title: '',
      date: '',
      description: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
        date: initialData.date || '',
        description: initialData.description || '',
      });
    } else {
      reset({
        title: '',
        date: '',
        description: '',
      });
    }
  }, [initialData, reset, isOpen]);

  const onFormSubmit = async (data: AchievementFormData) => {
    await onSubmit({
      title: data.title,
      date: data.date || undefined,
      description: data.description || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Achievement' : 'Add Achievement'}
      description="Record key awards, recognitions, patents, or certifications."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Achievement Title *
          </label>
          <Input placeholder="e.g. 1st Place Hackathon Winner / AWS Certified Solutions Architect" {...register('title')} error={errors.title?.message} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Date
          </label>
          <Input type="date" {...register('date')} error={errors.date?.message} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description
          </label>
          <Textarea rows={3} placeholder="Details about the award or achievement..." {...register('description')} error={errors.description?.message} />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {initialData ? 'Update Achievement' : 'Create Achievement'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
