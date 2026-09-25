'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skill, SkillCreate } from '@/types';

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(100),
  category: z.string().max(100).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

type SkillFormData = z.infer<typeof skillSchema>;

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SkillCreate) => Promise<void>;
  initialData?: Skill | null;
  isLoading?: boolean;
}

export function SkillModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: SkillModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        category: initialData.category || '',
        description: initialData.description || '',
      });
    } else {
      reset({
        name: '',
        category: '',
        description: '',
      });
    }
  }, [initialData, reset, isOpen]);

  const onFormSubmit = async (data: SkillFormData) => {
    await onSubmit({
      name: data.name,
      category: data.category || undefined,
      description: data.description || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Skill' : 'Add Skill'}
      description="Add soft/hard skills or domain competencies."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Skill Name *
          </label>
          <Input placeholder="e.g. Distributed Systems Architecture" {...register('name')} error={errors.name?.message} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Category
          </label>
          <Input placeholder="e.g. Backend, Leadership, Cloud" {...register('category')} error={errors.category?.message} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description
          </label>
          <Textarea placeholder="Optional details..." {...register('description')} error={errors.description?.message} />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {initialData ? 'Update Skill' : 'Create Skill'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
