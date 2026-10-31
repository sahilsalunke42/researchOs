'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { WorkspaceTabs } from '@/components/workspace/WorkspaceTabs';
import { useResearchJob } from '@/hooks/useResearchJob';
import type { ProjectDTO } from '@/types/api.types';
import { ArrowLeft, ChevronRight, Layers, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const job = useResearchJob(params.id);
  const displayStatus = job.status || project?.status || 'QUEUED';

  useEffect(() => {
    api.get<{ project: ProjectDTO }>(`/api/projects/${params.id}`)
      .then((res) => setProject(res.project))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load project'));
  }, [params.id]);

  if (error) {
    return (
      <div className="p-6 rounded-lg border border-accent-red/30 bg-accent-red/10 text-accent-red space-y-3">
        <h2 className="text-sm font-semibold">Error Loading Project Workspace</h2>
        <p className="text-xs">{error}</p>
        <Link href="/projects" className="inline-flex items-center gap-1 text-xs font-medium underline">
          <ArrowLeft className="h-3 w-3" /> Back to Projects
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center text-xs font-mono text-text-muted animate-pulse">
        Initializing scientific workspace environment...
      </div>
    );
  }

  const isComplete = displayStatus === 'COMPLETE';
  const isError = displayStatus === 'ERROR';
  const isActive = !isComplete && !isError && displayStatus !== 'QUEUED';

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Precision Instrument Header */}
      <div className="pb-4 border-b border-border space-y-2">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono">
          <Link href="/projects" className="hover:text-text-primary transition-colors">
            Projects
          </Link>
          <ChevronRight className="h-3 w-3 text-text-muted/60" />
          <span className="text-text-primary font-medium truncate max-w-[200px] sm:max-w-md">
            {project.name}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                {project.name}
              </h1>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border font-medium',
                  isComplete && 'bg-accent-green/15 text-accent-green border-accent-green/20',
                  isError && 'bg-accent-red/15 text-accent-red border-accent-red/20',
                  isActive && 'bg-accent-amber/15 text-accent-amber border-accent-amber/20',
                  displayStatus === 'QUEUED' && 'bg-bg-subtle text-text-muted border-border'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    isComplete && 'bg-accent-green',
                    isError && 'bg-accent-red',
                    isActive && 'bg-accent-amber animate-pulse',
                    displayStatus === 'QUEUED' && 'bg-text-muted'
                  )}
                />
                {displayStatus}
              </span>
            </div>
            {project.topic && (
              <p className="text-xs text-text-muted max-w-3xl leading-relaxed">
                {project.topic}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-text-muted shrink-0 font-mono">
            <span className="flex items-center gap-1.5 bg-bg-surface px-2.5 py-1 rounded border border-border">
              <Layers className="h-3.5 w-3.5 text-text-muted" />
              <span>Limit: {project.paperLimit} papers</span>
            </span>
          </div>
        </div>
      </div>

      <WorkspaceTabs projectId={project.id} />
    </div>
  );
}
