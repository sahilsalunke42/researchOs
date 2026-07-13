import Link from 'next/link';
import type { ProjectDTO, ProjectStatusDTO } from '@/types/api.types';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<ProjectStatusDTO, string> = {
  QUEUED: 'Queued',
  DISCOVERING: 'Discovering',
  INGESTING: 'Ingesting',
  REPORTING: 'Reporting',
  COMPLETE: 'Complete',
  ERROR: 'Error'
};

const STATUS_COLOR: Record<ProjectStatusDTO, string> = {
  QUEUED: 'text-text-muted',
  DISCOVERING: 'text-accent-amber',
  INGESTING: 'text-accent-amber',
  REPORTING: 'text-accent-amber',
  COMPLETE: 'text-accent-green',
  ERROR: 'text-accent-red'
};

export function ProjectCard({ project }: { project: ProjectDTO }) {
  const isQueued = project.status === 'QUEUED';
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block border border-border rounded-lg p-4 bg-bg-surface hover:border-accent transition-colors duration-150 ease-snap"
    >
      <div className="font-medium">{project.name}</div>
      <div className={cn('text-sm mt-1', STATUS_COLOR[project.status])}>
        ● {STATUS_LABEL[project.status]}
      </div>
      <div className="text-sm text-text-muted mt-2">
        {isQueued ? 'Topic set' : `${project.paperLimit} papers`}
      </div>
    </Link>
  );
}
