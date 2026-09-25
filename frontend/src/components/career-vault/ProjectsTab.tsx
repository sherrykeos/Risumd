'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Code, ExternalLink, Calendar, ShieldCheck } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ProjectModal } from './ProjectModal';
import { formatDate } from '@/lib/utils';
import { projectService } from '@/services/career-vault';
import { Project, ProjectCreate } from '@/types';

export function ProjectsTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: projects, isLoading, isError, error } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: ProjectCreate) => projectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to create project.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProjectCreate }) =>
      projectService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      setEditingProject(null);
      setErrorMessage(null);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to update project.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeletingId(null);
    },
    onError: (err: Error) => {
      alert(`Delete failed: ${err.message}`);
    },
  });

  const handleOpenAdd = () => {
    setEditingProject(null);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: ProjectCreate) => {
    if (editingProject) {
      await updateMutation.mutateAsync({ id: editingProject.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
        Failed to load projects: {(error as Error)?.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Projects</h2>
          <p className="text-xs text-slate-500">
            Showcase technical projects, open-source work, and personal software builds.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col justify-between hover:border-slate-300 transition-colors">
              <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{project.name}</h3>
                      {project.role && (
                        <p className="text-xs font-semibold text-indigo-600 mt-0.5">{project.role}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(project)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(project.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center space-x-1 text-xs text-slate-500 mt-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {formatDate(project.start_date)} - {project.end_date ? formatDate(project.end_date) : 'Present'}
                      </span>
                    </div>
                  )}

                  {project.description && (
                    <p className="text-sm text-slate-600 mt-3 whitespace-pre-line leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-3 mt-4 pt-3 border-t border-slate-100">
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        <Code className="mr-1 h-3.5 w-3.5" /> Code
                      </a>
                    )}
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-indigo-600"
                      >
                        <ExternalLink className="mr-1 h-3.5 w-3.5" /> Live Demo
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <Code className="h-3.5 w-3.5 text-slate-400 mr-1" />
                      {project.technologies.map((tech) => (
                        <Badge key={tech.id} variant="secondary" className="text-[10px]">
                          {tech.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {project.skills && project.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400 mr-1" />
                      {project.skills.map((skill) => (
                        <Badge key={skill.id} variant="outline" className="text-[10px]">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-slate-500">No projects added yet.</p>
          <Button onClick={handleOpenAdd} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Your First Project
          </Button>
        </Card>
      )}

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingProject}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {errorMessage && (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-rose-600 text-white text-sm font-medium rounded-xl shadow-lg flex items-center space-x-2">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-2 underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
