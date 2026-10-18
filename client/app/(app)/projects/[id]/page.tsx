'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { WorkspaceTabs } from '@/components/workspace/WorkspaceTabs';
import type { ProjectDTO } from '@/types/api.types';
import { ArrowLeft, BookOpen, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ project: ProjectDTO }>(`/api/projects/${params.id}`)
      .then((res) => setProject(res.project))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load project'));
  }, [params.id]);

  if (error) {
    return (
      <div className="p-6 rounded-lg border border-accent-red/30 bg-accent-red/10 text-accent-red">
        <h2 className="text-base font-semibold">Error Loading Project</h2>
        <p className="text-xs mt-1">{error}</p>
        <Link href="/projects" className="inline-block text-xs font-medium underline mt-3">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-12 text-center text-text-muted text-sm">
        Loading project workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Projects
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">{project.name}</h1>
            <span
              className={cn(
                'text-xs px-2.5 py-0.5 rounded font-mono font-medium',
                project.status === 'COMPLETE' && 'bg-accent-green/15 text-accent-green',
                project.status === 'ERROR' && 'bg-accent-red/15 text-accent-red',
                project.status !== 'COMPLETE' && project.status !== 'ERROR' && 'bg-accent/15 text-accent'
              )}
            >
              {project.status}
            </span>
          </div>
          <p className="text-xs text-text-muted max-w-2xl leading-relaxed">
            {project.topic}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted shrink-0">
          <span className="flex items-center gap-1 bg-bg-surface px-2.5 py-1 rounded border border-border">
            <Layers className="h-3.5 w-3.5 text-text-muted" />
            Limit: {project.paperLimit} papers
          </span>
        </div>
      </div>

      <WorkspaceTabs projectId={project.id} />
    </div>
  );
}
