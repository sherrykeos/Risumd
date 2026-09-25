'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Education, EducationCreate } from '@/types';

const educationSchema = z.object({
  institution: z.string().min(1, 'Institution name is required').max(255),
  degree: z.string().min(1, 'Degree is required').max(255),
  field: z.string().max(255).optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  grade: z.string().max(100).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

type EducationFormData = z.infer<typeof educationSchema>;

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EducationCreate) => Promise<void>;
  initialData?: Education | null;
  isLoading?: boolean;
}

export function EducationModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: EducationModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution: '',
      degree: '',
      field: '',
      start_date: '',
      end_date: '',
      grade: '',
      description: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        institution: initialData.institution || '',
        degree: initialData.degree || '',
        field: initialData.field || '',
        start_date: initialData.start_date || '',
        end_date: initialData.end_date || '',
        grade: initialData.grade || '',
        description: initialData.description || '',
      });
    } else {
      reset({
        institution: '',
        degree: '',
        field: '',
        start_date: '',
        end_date: '',
        grade: '',
        description: '',
      });
    }
  }, [initialData, reset, isOpen]);

  const onFormSubmit = async (data: EducationFormData) => {
    await onSubmit({
      institution: data.institution,
      degree: data.degree,
      field: data.field || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      grade: data.grade || undefined,
      description: data.description || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Education' : 'Add Education'}
      description="Record academic degrees, certifications, or coursework."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Institution / University *
            </label>
            <Input placeholder="e.g. Stanford University" {...register('institution')} error={errors.institution?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Degree *
            </label>
            <Input placeholder="e.g. Bachelor of Science" {...register('degree')} error={errors.degree?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Field of Study
            </label>
            <Input placeholder="e.g. Computer Science" {...register('field')} error={errors.field?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Grade / GPA
            </label>
            <Input placeholder="e.g. 3.9 / 4.0" {...register('grade')} error={errors.grade?.message} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <Input type="date" {...register('start_date')} error={errors.start_date?.message} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                End Date
              </label>
              <Input type="date" {...register('end_date')} error={errors.end_date?.message} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description / Honors / Relevant Coursework
          </label>
          <Textarea rows={3} placeholder="Honors, thesis, relevant coursework..." {...register('description')} error={errors.description?.message} />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {initialData ? 'Update Education' : 'Create Education'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
