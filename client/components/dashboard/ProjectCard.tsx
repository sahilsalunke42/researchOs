import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import type { ProjectDTO, ProjectStatusDTO } from '@/types/api.types';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<ProjectStatusDTO, string> = {
  QUEUED: 'Queued in Pipeline',
  DISCOVERING: 'Discovering Papers',
  INGESTING: 'Parsing & Vectorizing',
  REPORTING: 'Synthesizing Brief',
  COMPLETE: 'Synthesis Complete',
  ERROR: 'Pipeline Error'
};

const STATUS_STAGE_LABEL: Record<ProjectStatusDTO, string> = {
  QUEUED: 'Stage 1/4 • Queue',
  DISCOVERING: 'Stage 2/4 • Discovery',
  INGESTING: 'Stage 3/4 • Vectorizing',
  REPORTING: 'Stage 4/4 • Synthesis',
  COMPLETE: 'Stage 4/4 • Complete',
  ERROR: 'Error'
};

const STATUS_PROGRESS: Record<ProjectStatusDTO, number> = {
  QUEUED: 20,
  DISCOVERING: 45,
  INGESTING: 70,
  REPORTING: 88,
  COMPLETE: 100,
  ERROR: 100
};

const STATUS_STYLE: Record<ProjectStatusDTO, { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  QUEUED: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', icon: Clock },
  DISCOVERING: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200/80', icon: Loader2 },
  INGESTING: { bg: 'bg-indigo-50', text: 'text-accent', border: 'border-indigo-200/80', icon: Loader2 },
  REPORTING: { bg: 'bg-indigo-50', text: 'text-accent', border: 'border-indigo-200/80', icon: Loader2 },
  COMPLETE: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200/80', icon: CheckCircle2 },
  ERROR: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200/80', icon: AlertCircle }
};

export function ProjectCard({ project }: { project: ProjectDTO }) {
  const isQueued = project.status === 'QUEUED';
  const progress = STATUS_PROGRESS[project.status];
  const style = STATUS_STYLE[project.status];
  const StatusIcon = style.icon;
  const isLoading = ['DISCOVERING', 'INGESTING', 'REPORTING'].includes(project.status);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:border-accent/40 transition-all duration-200 overflow-hidden"
    >
      <div>
        {/* Top Status & Date Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border', style.bg, style.text, style.border)}>
            <StatusIcon className={cn('w-3 h-3', isLoading && 'animate-spin')} />
            <span>{STATUS_LABEL[project.status]}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Project Title & Research Topic */}
        <div className="space-y-1 mb-4">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-accent transition-colors line-clamp-1">
            {project.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {project.topic || 'No topic specified'}
          </p>
        </div>
      </div>

      <div>
        {/* Polished SaaS Progress Bar Component */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {STATUS_STAGE_LABEL[project.status]}
            </span>
            <span className="font-mono font-semibold text-slate-700">{progress}%</span>
          </div>

          {/* Soft Background Track */}
          <div className="h-2 w-full bg-slate-100 border border-slate-200/60 rounded-full overflow-hidden p-[1px]">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out shadow-2xs',
                project.status === 'COMPLETE'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : project.status === 'ERROR'
                    ? 'bg-red-500'
                    : 'bg-gradient-to-r from-accent via-indigo-600 to-indigo-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Bottom Metadata & CTA Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            {isQueued ? 'Topic set' : `${project.paperLimit} papers limit`}
          </span>

          <span className="inline-flex items-center gap-1 font-semibold text-accent group-hover:translate-x-0.5 transition-transform duration-200">
            Open Workspace <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
