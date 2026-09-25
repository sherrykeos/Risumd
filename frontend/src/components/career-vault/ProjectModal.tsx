'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Project, ProjectCreate } from '@/types';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  role: z.string().max(255).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  github_url: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || val.startsWith('http://') || val.startsWith('https://'), {
      message: 'URL must start with http:// or https://',
    }),
  live_url: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || val.startsWith('http://') || val.startsWith('https://'), {
      message: 'URL must start with http:// or https://',
    }),
  technologies: z.string().optional().or(z.literal('')),
  skills: z.string().optional().or(z.literal('')),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectCreate) => Promise<void>;
  initialData?: Project | null;
  isLoading?: boolean;
}

export function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: ProjectModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      role: '',
      description: '',
      start_date: '',
      end_date: '',
      github_url: '',
      live_url: '',
      technologies: '',
      skills: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        role: initialData.role || '',
        description: initialData.description || '',
        start_date: initialData.start_date || '',
        end_date: initialData.end_date || '',
        github_url: initialData.github_url || '',
        live_url: initialData.live_url || '',
        technologies: initialData.technologies?.map((t) => t.name).join(', ') || '',
        skills: initialData.skills?.map((s) => s.name).join(', ') || '',
      });
    } else {
      reset({
        name: '',
        role: '',
        description: '',
        start_date: '',
        end_date: '',
        github_url: '',
        live_url: '',
        technologies: '',
        skills: '',
      });
    }
  }, [initialData, reset, isOpen]);

  const onFormSubmit = async (data: ProjectFormData) => {
    const techArray = data.technologies
      ? data.technologies.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const skillArray = data.skills
      ? data.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const payload: ProjectCreate = {
      name: data.name,
      role: data.role || undefined,
      description: data.description || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      github_url: data.github_url || undefined,
      live_url: data.live_url || undefined,
      technologies: techArray,
      skills: skillArray,
    };

    await onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Project' : 'Add New Project'}
      description="Record key details about a technical project in your Career Vault."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Project Name *
          </label>
          <Input placeholder="e.g. Risumd Career Workspace" {...register('name')} error={errors.name?.message} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Role
            </label>
            <Input placeholder="e.g. Lead Architect" {...register('role')} error={errors.role?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              GitHub URL
            </label>
            <Input placeholder="https://github.com/..." {...register('github_url')} error={errors.github_url?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Live Demo / Portfolio URL
            </label>
            <Input placeholder="https://myproject.com" {...register('live_url')} error={errors.live_url?.message} />
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
            Description
          </label>
          <Textarea
            rows={3}
            placeholder="Describe what the project achieves, your contributions, key architecture..."
            {...register('description')}
            error={errors.description?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Technologies (comma-separated)
            </label>
            <Input placeholder="Next.js, FastAPI, PostgreSQL" {...register('technologies')} error={errors.technologies?.message} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Skills (comma-separated)
            </label>
            <Input placeholder="System Design, API Development" {...register('skills')} error={errors.skills?.message} />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {initialData ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
