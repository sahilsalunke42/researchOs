'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Sparkles,
  Filter,
  Search,
  Clock,
  Database,
  BrainCircuit,
  FileCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import type { ProjectDTO } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ACTIVE_STATUSES = new Set(['QUEUED', 'DISCOVERING', 'INGESTING', 'REPORTING']);

export default function ReportsPage() {
  const [projects, setProjects] = useState<ProjectDTO[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETE' | 'PENDING'>('ALL');

  useEffect(() => {
    api.get<{ projects: ProjectDTO[] }>('/api/projects')
      .then(res => setProjects(res.projects))
      .catch(() => setProjects([]));
  }, []);

  const totalReports = projects?.length ?? 0;
  const completedReports = projects?.filter(p => p.status === 'COMPLETE') ?? [];
  const pendingReports = projects?.filter(p => ACTIVE_STATUSES.has(p.status)) ?? [];
  const totalPapers = projects?.reduce((acc, p) => acc + (p.paperLimit || 20), 0) ?? 0;

  const filtered = (projects ?? []).filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'COMPLETE') return p.status === 'COMPLETE';
    if (statusFilter === 'PENDING') return ACTIVE_STATUSES.has(p.status);
    return true;
  });

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
            <FileText className="w-3.5 h-3.5 text-accent" />
            <span>Synthesized Evidence Briefs & Markdown Reports</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Synthesized Research Reports ({completedReports.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Access, read, and export evidence-backed Markdown synthesis reports generated from 1536-dim vector similarity search.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Link href="/dashboard">
            <Button className="h-11 px-5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/25 hover:-translate-y-0.5 transition-all duration-200">
              <Sparkles className="w-4 h-4 mr-2" /> Start New Research Review
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. TOP SUMMARY METRICS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Projects</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100/80 text-accent">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalReports}</span>
            <span className="text-[10px] font-bold text-accent bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Workspace
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Synthesized Reports</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100/80 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{completedReports.length}</span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
              Markdown Ready
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-slate-50/50 to-amber-50/20 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Ingestion</span>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100/80 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{pendingReports.length}</span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80">
              In Pipeline
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Evidence Capacity</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100/80 text-accent">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalPapers}+</span>
            <span className="text-[10px] font-bold text-accent bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Papers Indexed
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
            placeholder="Search reports by project title, research topic, or methodology..."
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
            All ({totalReports})
          </button>

          <button
            onClick={() => setStatusFilter('COMPLETE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === 'COMPLETE'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Synthesized ({completedReports.length})
          </button>

          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === 'PENDING'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            In Pipeline ({pendingReports.length})
          </button>
        </div>
      </div>

      {/* 4. REPORTS LIST */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-accent mx-auto flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-slate-900">No Reports Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery ? 'No research reports match your search filter criteria.' : 'When a project completes paper ingestion and vector RAG synthesis, your Markdown brief will appear here automatically.'}
            </p>
          </div>
          <Link href="/dashboard">
            <Button className="h-10 px-5 rounded-xl bg-accent text-white text-xs font-bold shadow-sm">
              + Go to Dashboard & Start Review
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {filtered.map(report => (
            <div key={report.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-accent transition-colors">{report.name}</h3>
                  {report.status === 'COMPLETE' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-bold">
                      Markdown Brief Ready
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-bold">
                      Ingestion Pipeline Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{report.topic}</p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                  <span>Capacity: {report.paperLimit} papers</span>
                  <span>•</span>
                  <span>Updated: {new Date(report.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link href={`/projects/${report.id}`}>
                  <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-slate-200 text-xs font-semibold hover:border-accent hover:text-accent transition-all">
                    Read Report <ArrowRight className="w-3.5 h-3.5 ml-1.5 text-slate-400 group-hover:text-accent" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
