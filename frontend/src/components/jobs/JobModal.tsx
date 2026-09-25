'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Job, JobCreate } from '@/types';

const jobSchema = z.object({
  company: z.string().min(1, 'Company is required').max(255),
  title: z.string().min(1, 'Job title is required').max(255),
  location: z.string().max(255).optional().or(z.literal('')),
  source_url: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || val.startsWith('http://') || val.startsWith('https://'), {
      message: 'URL must start with http:// or https://',
    }),
  raw_description: z.string().min(1, 'Raw job description text is required'),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobCreate) => Promise<void>;
  initialData?: Job | null;
  isLoading?: boolean;
}

export function JobModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: JobModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      company: '',
      title: '',
      location: '',
      source_url: '',
      raw_description: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        company: initialData.company || '',
        title: initialData.title || '',
        location: initialData.location || '',
        source_url: initialData.source_url || '',
        raw_description: initialData.raw_description || '',
      });
    } else {
      reset({
        company: '',
        title: '',
        location: '',
        source_url: '',
        raw_description: '',
      });
    }
  }, [initialData, reset, isOpen]);

  const onFormSubmit = async (data: JobFormData) => {
    await onSubmit({
      company: data.company,
      title: data.title,
      location: data.location || undefined,
      source_url: data.source_url || undefined,
      raw_description: data.raw_description,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Target Job' : 'Add Target Job'}
      description="Add job details and raw description for Gemini AI analysis and resume tailoring."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Company *
            </label>
            <Input placeholder="e.g. Google" {...register('company')} error={errors.company?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Job Title *
            </label>
            <Input placeholder="e.g. Senior Backend Engineer" {...register('title')} error={errors.title?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Location
            </label>
            <Input placeholder="e.g. New York, NY (Hybrid)" {...register('location')} error={errors.location?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Posting Source URL
            </label>
            <Input placeholder="https://careers.google.com/jobs/..." {...register('source_url')} error={errors.source_url?.message} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Raw Job Description (JD) *
          </label>
          <Textarea
            rows={8}
            placeholder="Paste the full unedited job description text here..."
            {...register('raw_description')}
            error={errors.raw_description?.message}
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {initialData ? 'Update Job' : 'Create Job'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
