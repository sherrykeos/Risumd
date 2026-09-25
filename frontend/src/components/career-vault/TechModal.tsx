'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Technology, TechnologyCreate } from '@/types';

const techSchema = z.object({
  name: z.string().min(1, 'Technology name is required').max(100),
  description: z.string().optional().or(z.literal('')),
});

type TechFormData = z.infer<typeof techSchema>;

interface TechModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TechnologyCreate) => Promise<void>;
  initialData?: Technology | null;
  isLoading?: boolean;
}

export function TechModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: TechModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TechFormData>({
    resolver: zodResolver(techSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        description: initialData.description || '',
      });
    } else {
      reset({
        name: '',
        description: '',
      });
    }
  }, [initialData, reset, isOpen]);

  const onFormSubmit = async (data: TechFormData) => {
    await onSubmit({
      name: data.name,
      description: data.description || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Technology' : 'Add Technology'}
      description="Add programming languages, frameworks, databases, or tools."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Technology Name *
          </label>
          <Input placeholder="e.g. TypeScript, PostgreSQL, Kubernetes" {...register('name')} error={errors.name?.message} />
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
            {initialData ? 'Update Technology' : 'Create Technology'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
