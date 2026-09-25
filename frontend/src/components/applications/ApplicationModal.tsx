'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Application, ApplicationCreate, ApplicationStatus, Job, ResumeVersion } from '@/types';

const STATUS_OPTIONS: ApplicationStatus[] = [
  'DRAFT',
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
];

const appSchema = z.object({
  job_id: z.string().min(1, 'Target job is required'),
  resume_version_id: z.string().min(1, 'Submitted resume version is required'),
  status: z.string(),
  applied_at: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type AppFormData = z.infer<typeof appSchema>;

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationCreate) => Promise<void>;
  jobs: Job[];
  resumes: ResumeVersion[];
  initialData?: Application | null;
  preselectedJobId?: number;
  isLoading?: boolean;
}

export function ApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  jobs,
  resumes,
  initialData,
  preselectedJobId,
  isLoading = false,
}: ApplicationModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AppFormData>({
    resolver: zodResolver(appSchema),
    defaultValues: {
      job_id: preselectedJobId ? String(preselectedJobId) : '',
      resume_version_id: '',
      status: 'APPLIED',
      applied_at: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const selectedJobIdStr = watch('job_id');
  const selectedJobId = selectedJobIdStr ? Number(selectedJobIdStr) : null;

  const availableResumes = resumes.filter(
    (r) => !selectedJobId || r.job_id === selectedJobId
  );

  useEffect(() => {
    if (initialData) {
      reset({
        job_id: String(initialData.job_id),
        resume_version_id: String(initialData.resume_version_id),
        status: initialData.status,
        applied_at: initialData.applied_at ? initialData.applied_at.split('T')[0] : '',
        notes: initialData.notes || '',
      });
    } else {
      reset({
        job_id: preselectedJobId ? String(preselectedJobId) : jobs[0] ? String(jobs[0].id) : '',
        resume_version_id: '',
        status: 'APPLIED',
        applied_at: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [initialData, preselectedJobId, jobs, reset, isOpen]);

  const onFormSubmit = async (data: AppFormData) => {
    await onSubmit({
      job_id: Number(data.job_id),
      resume_version_id: Number(data.resume_version_id),
      status: data.status as ApplicationStatus,
      applied_at: data.applied_at ? new Date(data.applied_at).toISOString() : undefined,
      notes: data.notes || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Application' : 'Create New Application'}
      description="Link a target job with an exact generated resume version to track submission status."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Target Job *
          </label>
          <Select {...register('job_id')} error={errors.job_id?.message} disabled={Boolean(initialData)}>
            <option value="">Select a Job...</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.company} — {j.title}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Submitted Resume Version *
          </label>
          <Select {...register('resume_version_id')} error={errors.resume_version_id?.message}>
            <option value="">Select a Resume Version...</option>
            {availableResumes.map((r) => (
              <option key={r.id} value={r.id}>
                Resume v{r.version_number} (Created {new Date(r.created_at).toLocaleDateString()})
              </option>
            ))}
          </Select>
          {selectedJobId && availableResumes.length === 0 && (
            <p className="mt-1 text-xs text-rose-500">
              No resumes generated for this job yet. Please generate a resume first.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Status
            </label>
            <Select {...register('status')} error={errors.status?.message}>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Applied Date
            </label>
            <Input type="date" {...register('applied_at')} error={errors.applied_at?.message} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Notes / Referral Info
          </label>
          <Textarea rows={3} placeholder="Recruiter contacts, referral details, interview dates..." {...register('notes')} error={errors.notes?.message} />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={availableResumes.length === 0}>
            {initialData ? 'Update Application' : 'Create Application'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
