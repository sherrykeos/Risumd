'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  FolderKanban,
  ExternalLink,
  Code,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ProjectModal } from './ProjectModal';
import { formatDate } from '@/lib/utils';
import { projectService } from '@/services/career-vault';
import { Project, ProjectCreate } from '@/types';

export function ProjectsTab() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);

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
    setActionMenuId(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: ProjectCreate) => {
    if (editingProject) {
      await updateMutation.mutateAsync({ id: editingProject.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.technologies?.some((t) => t.name.toLowerCase().includes(q))
      );
    });
  }, [projects, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Top Controls: Search + Add project */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full sm:w-64 rounded-[6px] border border-white/[0.08] bg-[#10161B] pl-8 pr-3 text-xs text-[#F3F4F6] placeholder:text-[#6B7280] focus:border-[#4D9FFF]/60 focus:outline-hidden focus:ring-1 focus:ring-[#4D9FFF]/30 transition-colors"
          />
        </div>

        <Button
          onClick={handleOpenAdd}
          className="bg-[#4D9FFF] hover:bg-[#3B8EEA] text-white text-xs font-medium h-8 px-3 rounded-[6px] shadow-none flex items-center shrink-0"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add project
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-[8px] text-rose-400 text-xs">
          Failed to load projects: {(error as Error)?.message || 'Unknown error'}
        </div>
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <div className="space-y-2.5">
          {filteredProjects.map((project) => {
            const isMenuOpen = actionMenuId === project.id;
            const dateRange =
              project.start_date || project.end_date
                ? `${formatDate(project.start_date)} — ${
                    project.end_date ? formatDate(project.end_date) : 'Present'
                  }`
                : null;

            return (
              <div
                key={project.id}
                className="bg-[#10161B] border border-white/[0.08] hover:border-white/[0.14] rounded-[8px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors group"
              >
                {/* Left: Icon + Content */}
                <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-[6px] bg-[#0B0F12] border border-white/[0.08] flex items-center justify-center text-[#4D9FFF] shrink-0 mt-0.5">
                    <FolderKanban className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-sm text-[#F3F4F6] truncate">
                        {project.name}
                      </h3>
                      {project.role && (
                        <span className="text-[11px] text-[#6B7280]">· {project.role}</span>
                      )}
                    </div>

                    {project.description && (
                      <p className="text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    )}

                    {/* Technologies tags */}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.technologies.map((tech) => (
                          <span
                            key={tech.id}
                            className="px-2 py-0.5 rounded-[4px] bg-white/[0.04] text-[#9CA3AF] border border-white/[0.08] text-[11px] font-mono"
                          >
                            {tech.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Date, Link, Actions */}
                <div className="flex items-center space-x-3 self-end md:self-center shrink-0">
                  {dateRange && (
                    <span className="text-xs text-[#6B7280] whitespace-nowrap">
                      {dateRange}
                    </span>
                  )}

                  {project.live_url && (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-[#6B7280] hover:text-[#F3F4F6] transition-colors"
                      title="Live demo"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}

                  {project.github_url && !project.live_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-[#6B7280] hover:text-[#F3F4F6] transition-colors"
                      title="Source code"
                    >
                      <Code className="h-3.5 w-3.5" />
                    </a>
                  )}

                  {/* 3 dots menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActionMenuId(isMenuOpen ? null : project.id)}
                      className="p-1 rounded text-[#6B7280] hover:text-[#F3F4F6] hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-28 bg-[#131A20] border border-white/[0.1] rounded-[6px] shadow-xl py-1 z-20">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(project)}
                          className="w-full text-left px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/[0.05] flex items-center cursor-pointer"
                        >
                          <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingId(project.id);
                            setActionMenuId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#10161B] border border-white/[0.08] rounded-[8px] p-8 text-center">
          <p className="text-xs text-[#9CA3AF]">No projects found in Career Vault.</p>
          <Button onClick={handleOpenAdd} variant="outline" className="mt-3 text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Project
          </Button>
        </div>
      )}

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingProject}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {errorMessage && (
        <div className="fixed bottom-4 right-4 z-50 p-3 bg-rose-500 text-white text-xs font-medium rounded-[6px] shadow-lg flex items-center space-x-2">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-2 underline cursor-pointer">
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
