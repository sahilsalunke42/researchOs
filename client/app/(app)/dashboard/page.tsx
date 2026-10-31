'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { ProjectDTO } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { NewProjectModal } from '@/components/workspace/NewProjectModal';
import { Plus, ArrowRight, Activity, CheckCircle2, Clock, Layers, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIVE_STATUSES = new Set(['QUEUED', 'DISCOVERING', 'INGESTING', 'ANALYZING', 'REPORTING']);

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectDTO[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETE'>('ALL');

  useEffect(() => {
    api.get<{ projects: ProjectDTO[] }>('/api/projects')
      .then((res) => setProjects(res.projects || []))
      .catch(() => setProjects([]));
  }, []);

  const activeProjects = useMemo(
    () => (projects || []).filter((p) => ACTIVE_STATUSES.has(p.status)),
    [projects]
  );
  const completedProjects = useMemo(
    () => (projects || []).filter((p) => p.status === 'COMPLETE'),
    [projects]
  );

  const displayedProjects = useMemo(() => {
    if (!projects) return [];
    if (filter === 'ACTIVE') return activeProjects;
    if (filter === 'COMPLETE') return completedProjects;
    return projects;
  }, [projects, filter, activeProjects, completedProjects]);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Instrument Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Research Dashboard
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono">
            {projects === null ? (
              'Synchronizing workspace state...'
            ) : (
              <span>
                {projects.length} Total Projects •{' '}
                <span className="text-accent-amber font-medium">
                  {activeProjects.length} Active
                </span>{' '}
                •{' '}
                <span className="text-accent-green font-medium">
                  {completedProjects.length} Completed
                </span>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setModalOpen(true)}
            className="h-9 px-4 text-xs font-medium rounded-md bg-accent text-white hover:bg-accent/90 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Research Project
          </Button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {projects === null && (
        <div className="p-8 rounded-lg border border-border bg-bg-surface text-center text-xs text-text-muted font-mono animate-pulse">
          Loading research ledger...
        </div>
      )}

      {/* Actionable Empty State */}
      {projects && projects.length === 0 && (
        <div className="p-12 rounded-lg border border-border bg-bg-surface text-center space-y-4">
          <div className="h-10 w-10 mx-auto rounded-full bg-accent/10 text-accent flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              No active research projects
            </h2>
            <p className="text-xs text-text-muted max-w-md mx-auto mt-1 leading-relaxed">
              Launch your first automated literature review. Enter a research question and ResearchOS will discover papers, extract claims, and identify validated gaps.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={() => setModalOpen(true)}
              className="h-9 px-4 text-xs bg-accent text-white hover:bg-accent/90"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Start First Project
            </Button>
          </div>
        </div>
      )}

      {/* Active Pipeline Telemetry Strip */}
      {activeProjects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent-amber animate-ping" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-text-muted">
              Active Pipelines ({activeProjects.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      )}

      {/* Complete Project Ledger */}
      {projects && projects.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-text-muted">
              Project Ledger
            </h2>
            {/* Filter Pills */}
            <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-bg-surface text-xs font-mono">
              <button
                onClick={() => setFilter('ALL')}
                className={cn(
                  'px-2.5 py-1 rounded transition-colors',
                  filter === 'ALL'
                    ? 'bg-bg-subtle text-text-primary font-medium'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                All ({projects.length})
              </button>
              <button
                onClick={() => setFilter('ACTIVE')}
                className={cn(
                  'px-2.5 py-1 rounded transition-colors',
                  filter === 'ACTIVE'
                    ? 'bg-bg-subtle text-text-primary font-medium'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                Active ({activeProjects.length})
              </button>
              <button
                onClick={() => setFilter('COMPLETE')}
                className={cn(
                  'px-2.5 py-1 rounded transition-colors',
                  filter === 'COMPLETE'
                    ? 'bg-bg-subtle text-text-primary font-medium'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                Complete ({completedProjects.length})
              </button>
            </div>
          </div>

          <div className="border border-border rounded-lg bg-bg-surface overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-bg-subtle/50 text-text-muted font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-medium">Project Name & Topic</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium">Corpus Limit</th>
                    <th className="py-2.5 px-4 font-medium">Updated</th>
                    <th className="py-2.5 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {displayedProjects.map((p) => {
                    const isActive = ACTIVE_STATUSES.has(p.status);
                    const isDone = p.status === 'COMPLETE';
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-bg-subtle/40 transition-colors group"
                      >
                        <td className="py-3 px-4">
                          <Link
                            href={`/projects/${p.id}`}
                            className="font-medium text-text-primary group-hover:text-accent transition-colors block"
                          >
                            {p.name}
                          </Link>
                          {p.topic && (
                            <span className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                              {p.topic}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border',
                              isActive && 'text-accent-amber bg-accent-amber/15 border-accent-amber/20',
                              isDone && 'text-accent-green bg-accent-green/15 border-accent-green/20',
                              p.status === 'ERROR' && 'text-accent-red bg-accent-red/15 border-accent-red/20',
                              p.status === 'QUEUED' && 'text-text-muted bg-bg-subtle border-border'
                            )}
                          >
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                isActive && 'bg-accent-amber animate-pulse',
                                isDone && 'bg-accent-green',
                                p.status === 'ERROR' && 'bg-accent-red',
                                p.status === 'QUEUED' && 'bg-text-muted'
                              )}
                            />
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-text-muted tabular-nums whitespace-nowrap">
                          {p.paperLimit} papers
                        </td>
                        <td className="py-3 px-4 font-mono text-text-muted tabular-nums whitespace-nowrap">
                          {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/projects/${p.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                          >
                            Workspace
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <NewProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(newP) => {
          setProjects((prev) => [newP, ...(prev || [])]);
          router.push(`/projects/${newP.id}`);
        }}
      />
    </div>
  );
}
