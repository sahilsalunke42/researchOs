'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  FolderKanban,
  BookOpen,
  RefreshCw,
  Clock,
  CheckCircle2,
  Database,
  Filter,
  Layers,
  BrainCircuit,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import type { ProjectDTO } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { NewProjectModal } from '@/components/workspace/NewProjectModal';

const ACTIVE_STATUSES = new Set(['QUEUED', 'DISCOVERING', 'INGESTING', 'REPORTING']);

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectDTO[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETE'>('ALL');

  function fetchProjects() {
    api.get<{ projects: ProjectDTO[] }>('/api/projects')
      .then(res => setProjects(res.projects))
      .catch(() => setProjects([]));
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  const activeCount = projects?.filter(p => ACTIVE_STATUSES.has(p.status)).length ?? 0;
  const completeCount = projects?.filter(p => p.status === 'COMPLETE').length ?? 0;
  const totalPapers = projects?.reduce((acc, p) => acc + (p.paperLimit || 20), 0) ?? 0;

  const filtered = projects?.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ACTIVE') return ACTIVE_STATUSES.has(p.status);
    if (statusFilter === 'COMPLETE') return p.status === 'COMPLETE';
    return true;
  }) ?? [];

  return (
    <div className="w-full space-y-8 animate-fade-in-up pb-12">
      {/* 1. HERO HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-white via-indigo-50/60 to-slate-50 border border-slate-200/90 shadow-2xs relative overflow-hidden group">
        {/* Ambient Radial Glow */}
        <div
          className="absolute -right-12 -top-12 w-72 h-72 pointer-events-none opacity-50 group-hover:opacity-75 transition-opacity duration-500"
          style={{ background: 'radial-gradient(circle, rgba(79, 70, 229, 0.18) 0%, transparent 70%)' }}
        />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-light text-accent text-[11px] font-bold tracking-tight">
            <FolderKanban className="w-3.5 h-3.5 text-accent" />
            <span>Research Workspace Projects</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            All Research Investigations ({projects?.length ?? 0})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Manage literature reviews, paper ingestion pipelines, vector RAG embeddings, and synthesized evidence briefs.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Button
            onClick={() => setModalOpen(true)}
            className="h-11 px-5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/25 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" /> New Research Project
          </Button>
        </div>
      </div>

      {/* 2. TOP SUMMARY METRICS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Projects</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100/80 text-accent">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{projects?.length ?? 0}</span>
            <span className="text-[10px] font-bold text-accent bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Workspace
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-slate-50/50 to-amber-50/20 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Pipelines</span>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100/80 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{activeCount}</span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80">
              In Progress
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed Reviews</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100/80 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{completeCount}</span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
              Synthesized
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Papers Indexed</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100/80 text-accent">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalPapers}+</span>
            <span className="text-[10px] font-bold text-accent bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Vector RAG
            </span>
          </div>
        </div>
      </div>

      {/* 3. FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search projects by title, topic, or methodology..."
            className="pl-10 h-10 rounded-xl border-slate-200 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent bg-slate-50/50 focus:bg-white transition-all shadow-2xs"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 bg-slate-100/80 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            All ({projects?.length ?? 0})
          </button>

          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === 'ACTIVE'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            In Progress ({activeCount})
          </button>

          <button
            onClick={() => setStatusFilter('COMPLETE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === 'COMPLETE'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Synthesized ({completeCount})
          </button>
        </div>
      </div>

      {/* 4. PROJECTS GRID */}
      {projects === null && (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
          <div className="w-9 h-9 rounded-full bg-indigo-50 text-accent mx-auto flex items-center justify-center animate-spin">
            <RefreshCw className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading research workspace projects…</p>
        </div>
      )}

      {projects && filtered.length === 0 && (
        <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-accent mx-auto flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-slate-900">No Projects Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery ? 'No research projects match your search filter criteria.' : 'Create your first research project to start literature discovery.'}
            </p>
          </div>
          {!searchQuery && (
            <Button
              onClick={() => setModalOpen(true)}
              className="h-10 px-5 rounded-xl bg-accent text-white text-xs font-bold shadow-sm"
            >
              + Create First Research Project
            </Button>
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      <NewProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(project) => router.push(`/projects/${project.id}`)}
      />
    </div>
  );
}
