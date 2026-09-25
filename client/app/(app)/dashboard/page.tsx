'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  BookOpen,
  FolderKanban,
  FileText,
  Sparkles,
  GitCompare,
  Lightbulb,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  RefreshCw,
  Database,
  ShieldCheck,
  Activity,
  Layers,
  FileCode,
  Zap
} from 'lucide-react';
import { api } from '@/lib/api';
import type { ProjectDTO } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { NewProjectModal } from '@/components/workspace/NewProjectModal';

const ACTIVE_STATUSES = new Set(['QUEUED', 'DISCOVERING', 'INGESTING', 'REPORTING']);

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectDTO[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  function fetchProjects() {
    setRefreshing(true);
    api.get<{ projects: ProjectDTO[] }>('/api/projects')
      .then((res) => setProjects(res.projects))
      .catch(() => setProjects([]))
      .finally(() => setRefreshing(false));
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  const active = projects?.filter(p => ACTIVE_STATUSES.has(p.status)) ?? [];
  const completed = projects?.filter(p => p.status === 'COMPLETE') ?? [];
  const totalPapersIndexed = projects?.reduce((acc, p) => acc + (p.paperLimit || 20), 0) || 0;

  return (
    <div className="w-full space-y-8 animate-fade-in-up pb-12">

      {/* 1. WELCOME HERO BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-white via-indigo-50/60 to-slate-50 border border-slate-200/90 shadow-2xs relative overflow-hidden group">
        {/* Ambient Radial Glow */}
        <div
          className="absolute -right-12 -top-12 w-72 h-72 pointer-events-none opacity-50 group-hover:opacity-75 transition-opacity duration-500"
          style={{ background: 'radial-gradient(circle, rgba(79, 70, 229, 0.18) 0%, transparent 70%)' }}
        />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-light text-accent text-[11px] font-bold tracking-tight">
            <BrainCircuit className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span>AI Research Intelligence Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome to ResearchOS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Accelerate literature reviews, extract cross-study evidence matrices, and surface underexplored research gaps with 1536-dim vector RAG.
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

      {/* 2. TOP SUMMARY METRICS STRIP (4 ELEVATED CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Projects */}
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

        {/* Card 2: Active Pipeline */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-slate-50/50 to-amber-50/20 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Pipeline</span>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100/80 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{active.length}</span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80">
              In Progress
            </span>
          </div>
        </div>

        {/* Card 3: Completed Reviews */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed Reviews</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100/80 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{completed.length}</span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
              Synthesized
            </span>
          </div>
        </div>

        {/* Card 4: Papers Indexed */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Papers Indexed</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100/80 text-accent">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalPapersIndexed}+</span>
            <span className="text-[10px] font-bold text-accent bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Vector RAG
            </span>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTIONS GRID */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" /> Quick Actions
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Quick Action 1 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:border-accent/40 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-200">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-accent transition-colors">New Literature Search</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Fetch papers directly from arXiv & Semantic Scholar APIs.</p>
              </div>
            </div>
            <Button
              onClick={() => setModalOpen(true)}
              className="w-full h-9 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-xs transition-all"
            >
              Start Search <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

          {/* Quick Action 2 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:border-accent/40 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-200">
                <GitCompare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-accent transition-colors">Comparative Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Align methodologies, datasets, and findings across studies.</p>
              </div>
            </div>
            <Link href="/projects" className="block">
              <Button variant="outline" className="w-full h-9 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold">
                View Matrix <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
              </Button>
            </Link>
          </div>

          {/* Quick Action 3 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:border-accent/40 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-200">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-accent transition-colors">Detect Research Gaps</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Surface open questions, contradictions & unexamined areas.</p>
              </div>
            </div>
            <Link href="/projects" className="block">
              <Button variant="outline" className="w-full h-9 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold">
                Explore Gaps <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
              </Button>
            </Link>
          </div>

          {/* Quick Action 4 */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:border-accent/40 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-200">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-accent transition-colors">Export Evidence Brief</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Generate and download structured Markdown synthesis briefs.</p>
              </div>
            </div>
            <Link href="/reports" className="block">
              <Button variant="outline" className="w-full h-9 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold">
                View Reports <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. ACTIVE RESEARCH INVESTIGATIONS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-accent" /> Active Research Pipeline ({active.length})
            </h2>
            <p className="text-xs text-slate-500">Investigations currently being ingested, vector-indexed, or reported.</p>
          </div>
          <Link href="/projects" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
            View All Projects <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {projects === null && (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-accent mx-auto flex items-center justify-center animate-spin">
              <RefreshCw className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-slate-500">Loading research workspace projects…</p>
          </div>
        )}

        {projects && projects.length === 0 && (
          <div className="p-10 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-accent mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-slate-900">No Research Projects Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Start your first literature review to discover papers, compare evidence, and detect research gaps.
              </p>
            </div>
            <Button
              onClick={() => setModalOpen(true)}
              className="h-10 px-5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-xs"
            >
              + Create First Research Project
            </Button>
          </div>
        )}

        {active.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {active.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </section>

      {/* 5. RECENTLY COMPLETED REVIEWS & REPORTS */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed Research Briefs ({completed.length})
            </h2>
            <Link href="/reports" className="text-xs font-bold text-accent hover:underline">
              View Reports
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {completed.map(p => (
              <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{p.name}</span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                      Synthesis Complete
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{p.topic}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-mono text-slate-400">
                    {new Date(p.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <Link href={`/projects/${p.id}`}>
                    <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg border-slate-200 text-xs font-semibold">
                      Open Report →
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. COMPACT RESEARCH ACTIVITY & VECTOR ENGINE STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
        {/* Activity Log (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Live AI Research Activity</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">System Log</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div className="space-y-0.5 flex-1">
                <p className="font-semibold text-slate-800">arXiv & Semantic Scholar API ingestion operational</p>
                <p className="text-slate-400 text-[11px]">Direct paper metadata discovery & full-text extraction ready.</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">Just now</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
              <div className="space-y-0.5 flex-1">
                <p className="font-semibold text-slate-800">Qdrant Vector Database synchronized</p>
                <p className="text-slate-400 text-[11px]">1536-dimensional embedding similarity engine active.</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">2m ago</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <div className="space-y-0.5 flex-1">
                <p className="font-semibold text-slate-800">Evidence Matrix & Gap Detection modules initialized</p>
                <p className="text-slate-400 text-[11px]">Methodologies and findings cross-study alignment enabled.</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">1h ago</span>
            </div>
          </div>
        </div>

        {/* Vector Engine Health (1 col) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Engine Metrics</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Online
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">Vector Storage</span>
              <span className="font-mono font-bold text-slate-800">Qdrant Cloud</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">Embedding Dim</span>
              <span className="font-mono font-bold text-slate-800">1536 Cosine</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">Paper Limits</span>
              <span className="font-mono font-bold text-slate-800">20–100 / project</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Export Format</span>
              <span className="font-mono font-bold text-slate-800">Markdown (.md)</span>
            </div>
          </div>
        </div>
      </div>

      {/* NEW PROJECT MODAL */}
      <NewProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(project) => router.push(`/projects/${project.id}`)}
      />

    </div>
  );
}
