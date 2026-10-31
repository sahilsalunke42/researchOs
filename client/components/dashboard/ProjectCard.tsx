import Link from 'next/link';
import type { ProjectDTO, ProjectStatusDTO } from '@/types/api.types';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<
  ProjectStatusDTO,
  { label: string; dotClass: string; badgeClass: string }
> = {
  QUEUED: {
    label: 'Queued',
    dotClass: 'bg-text-muted',
    badgeClass: 'text-text-muted bg-bg-subtle border-border'
  },
  DISCOVERING: {
    label: 'Discovering',
    dotClass: 'bg-accent-amber animate-pulse',
    badgeClass: 'text-accent-amber bg-accent-amber/15 border-accent-amber/20'
  },
  INGESTING: {
    label: 'Ingesting',
    dotClass: 'bg-accent-amber animate-pulse',
    badgeClass: 'text-accent-amber bg-accent-amber/15 border-accent-amber/20'
  },
  ANALYZING: {
    label: 'Analyzing',
    dotClass: 'bg-accent-amber animate-pulse',
    badgeClass: 'text-accent-amber bg-accent-amber/15 border-accent-amber/20'
  },
  REPORTING: {
    label: 'Reporting',
    dotClass: 'bg-accent-amber animate-pulse',
    badgeClass: 'text-accent-amber bg-accent-amber/15 border-accent-amber/20'
  },
  COMPLETE: {
    label: 'Complete',
    dotClass: 'bg-accent-green',
    badgeClass: 'text-accent-green bg-accent-green/15 border-accent-green/20'
  },
  ERROR: {
    label: 'Error',
    dotClass: 'bg-accent-red',
    badgeClass: 'text-accent-red bg-accent-red/15 border-accent-red/20'
  }
};

export function ProjectCard({ project }: { project: ProjectDTO }) {
  const isQueued = project.status === 'QUEUED';
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.QUEUED;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block border border-border rounded-lg p-4 bg-bg-surface hover:border-accent hover:bg-bg-subtle/30 transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors truncate">
          {project.name}
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border shrink-0',
            cfg.badgeClass
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dotClass)} />
          {cfg.label}
        </span>
      </div>

      <p className="text-xs text-text-muted mt-2 line-clamp-2 leading-relaxed">
        {project.topic || 'No topic description provided.'}
      </p>

      <div className="flex items-center justify-between text-xs text-text-muted pt-3 mt-3 border-t border-border/60 font-mono">
        <span>{isQueued ? 'Topic set' : `${project.paperLimit} papers`}</span>
        <span className="flex items-center gap-1 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
          Open <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
