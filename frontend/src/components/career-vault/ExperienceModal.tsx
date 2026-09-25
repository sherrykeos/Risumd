'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Experience, ExperienceCreate } from '@/types';

const experienceSchema = z.object({
  company: z.string().min(1, 'Company is required').max(255),
  role: z.string().min(1, 'Role title is required').max(255),
  location: z.string().max(255).optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  technologies: z.string().optional().or(z.literal('')),
  skills: z.string().optional().or(z.literal('')),
});

type ExperienceFormData = z.infer<typeof experienceSchema>;

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExperienceCreate) => Promise<void>;
  initialData?: Experience | null;
  isLoading?: boolean;
}

export function ExperienceModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: ExperienceModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      company: '',
      role: '',
      location: '',
      start_date: '',
      end_date: '',
      description: '',
      technologies: '',
      skills: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        company: initialData.company || '',
        role: initialData.role || '',
        location: initialData.location || '',
        start_date: initialData.start_date || '',
        end_date: initialData.end_date || '',
        description: initialData.description || '',
        technologies: initialData.technologies?.map((t) => t.name).join(', ') || '',
        skills: initialData.skills?.map((s) => s.name).join(', ') || '',
      });
    } else {
      reset({
        company: '',
        role: '',
        location: '',
        start_date: '',
        end_date: '',
        description: '',
        technologies: '',
        skills: '',
      });
    }
  }, [initialData, reset, isOpen]);

  const onFormSubmit = async (data: ExperienceFormData) => {
    const techArray = data.technologies
      ? data.technologies.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const skillArray = data.skills
      ? data.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const payload: ExperienceCreate = {
      company: data.company,
      role: data.role,
      location: data.location || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      description: data.description || undefined,
      technologies: techArray,
      skills: skillArray,
    };

    await onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Work Experience' : 'Add Work Experience'}
      description="Record past or current professional employment experience."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Company / Organization *
            </label>
            <Input placeholder="e.g. Acme Corp" {...register('company')} error={errors.company?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Job Title / Role *
            </label>
            <Input placeholder="e.g. Senior Software Engineer" {...register('role')} error={errors.role?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Location
            </label>
            <Input placeholder="e.g. San Francisco, CA (Remote)" {...register('location')} error={errors.location?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Start Date
            </label>
            <Input type="date" {...register('start_date')} error={errors.start_date?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              End Date (Blank if current)
            </label>
            <Input type="date" {...register('end_date')} error={errors.end_date?.message} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Responsibilities & Accomplishments
          </label>
          <Textarea
            rows={4}
            placeholder="Key duties, bullet points of achievements, leadership roles..."
            {...register('description')}
            error={errors.description?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Technologies Used
            </label>
            <Input placeholder="Python, Docker, Kubernetes" {...register('technologies')} error={errors.technologies?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Skills Demonstrated
            </label>
            <Input placeholder="Microservices, Performance Optimization" {...register('skills')} error={errors.skills?.message} />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {initialData ? 'Update Experience' : 'Create Experience'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
