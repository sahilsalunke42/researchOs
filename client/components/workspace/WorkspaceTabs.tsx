'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  BookOpen,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Play,
  Layers,
  Database,
  Search,
  FileCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Tab = 'progress' | 'papers' | 'report';

interface WorkspacePaper {
  id: string;
  externalId: string;
  source: string;
  title: string;
  authors: string[];
  year?: number;
  pdfUrl?: string;
  citationCount?: number;
  abstractText?: string;
}

interface WorkspaceReport {
  id: string;
  projectId: string;
  content: string;
  createdAt: string;
}

interface WorkspaceTabsProps {
  projectId: string;
  projectStatus?: string;
  onReload?: () => void;
}

export function WorkspaceTabs({ projectId, projectStatus, onReload }: WorkspaceTabsProps) {
  const [tab, setTab] = useState<Tab>('progress');
  const [papers, setPapers] = useState<WorkspacePaper[] | null>(null);
  const [report, setReport] = useState<WorkspaceReport | null>(null);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [runningPipeline, setRunningPipeline] = useState(false);

  useEffect(() => {
    if (tab === 'papers' && papers === null) {
      setLoadingPapers(true);
      api.get<{ papers: WorkspacePaper[] }>(`/api/projects/${projectId}/papers`)
        .then(res => setPapers(res.papers))
        .catch(() => setPapers([]))
        .finally(() => setLoadingPapers(false));
    }

    if (tab === 'report' && report === null) {
      setLoadingReport(true);
      api.get<{ report: WorkspaceReport | null }>(`/api/projects/${projectId}/report`)
        .then(res => setReport(res.report))
        .catch(() => setReport(null))
        .finally(() => setLoadingReport(false));
    }
  }, [tab, projectId, papers, report]);

  async function handleRunPipeline() {
    if (runningPipeline) return;
    setRunningPipeline(true);
    try {
      await api.post(`/api/projects/${projectId}/research`, {});
      setPapers(null);
      setReport(null);
      if (onReload) onReload();
    } catch {
      // Handled
    } finally {
      setRunningPipeline(false);
    }
  }

  const isComplete = projectStatus === 'COMPLETE';

  return (
    <div className="space-y-6">
      {/* 1. SEGMENTED TAB NAVIGATION */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-fit">
        <button
          role="tab"
          aria-selected={tab === 'progress'}
          onClick={() => setTab('progress')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            tab === 'progress'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Activity className={cn('w-4 h-4', tab === 'progress' ? 'text-accent' : 'text-slate-400')} />
          <span>Pipeline Stepper</span>
        </button>

        <button
          role="tab"
          aria-selected={tab === 'papers'}
          onClick={() => setTab('papers')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            tab === 'papers'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <BookOpen className={cn('w-4 h-4', tab === 'papers' ? 'text-accent' : 'text-slate-400')} />
          <span>Ingested Papers {papers ? `(${papers.length})` : ''}</span>
        </button>

        <button
          role="tab"
          aria-selected={tab === 'report'}
          onClick={() => setTab('report')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
            tab === 'report'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <FileText className={cn('w-4 h-4', tab === 'report' ? 'text-accent' : 'text-slate-400')} />
          <span>Evidence Brief</span>
        </button>
      </div>

      {/* 2. TAB CONTENT PANELS */}
      <div className="pt-2">

        {/* TAB 1: PROGRESS & PIPELINE STEPPER */}
        {tab === 'progress' && (
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">AI Vector RAG Execution Pipeline</h3>
                <p className="text-xs text-slate-500">Autonomous 3-stage literature discovery and evidence synthesis engine.</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-accent text-xs font-bold">
                Qdrant 1536-dim Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Step 1 */}
              <div className={cn(
                'p-5 rounded-2xl border transition-all space-y-3',
                isComplete ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/50 border-slate-200'
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stage 01</span>
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Search className="w-4 h-4 text-accent" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900">Literature Search</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Fetch research papers from arXiv & Semantic Scholar APIs matching topic query.
                </p>
              </div>

              {/* Step 2 */}
              <div className={cn(
                'p-5 rounded-2xl border transition-all space-y-3',
                isComplete ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/50 border-slate-200'
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stage 02</span>
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Database className="w-4 h-4 text-accent" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900">Vector Ingestion</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Chunk full-text abstracts & generate 1536-dim embeddings stored in Qdrant Vector DB.
                </p>
              </div>

              {/* Step 3 */}
              <div className={cn(
                'p-5 rounded-2xl border transition-all space-y-3',
                isComplete ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/50 border-slate-200'
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stage 03</span>
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-accent" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900">Evidence Brief</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Synthesize evidence matrix, cross-study findings, and Markdown report summary.
                </p>
              </div>
            </div>

            {!isComplete && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">Run the research pipeline to fetch papers and generate the Markdown brief.</p>
                <Button
                  onClick={handleRunPipeline}
                  disabled={runningPipeline}
                  className="h-10 px-5 rounded-xl bg-accent text-white text-xs font-bold shadow-sm"
                >
                  {runningPipeline ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                  Run Ingestion & Synthesis
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INGESTED PAPERS */}
        {tab === 'papers' && (
          <div>
            {loadingPapers ? (
              <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
                <div className="w-9 h-9 rounded-full bg-indigo-50 text-accent mx-auto flex items-center justify-center animate-spin">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-500">Loading ingested project papers…</p>
              </div>
            ) : !papers || papers.length === 0 ? (
              <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-accent mx-auto flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-base font-bold text-slate-900">No Ingested Papers Yet</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Run the research pipeline to fetch and index research papers from arXiv and Semantic Scholar.
                  </p>
                </div>
                <Button
                  onClick={handleRunPipeline}
                  disabled={runningPipeline}
                  className="h-10 px-5 rounded-xl bg-accent text-white text-xs font-bold"
                >
                  {runningPipeline ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                  + Ingest Literature Papers Now
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {papers.map(p => {
                  const authorsStr = Array.isArray(p.authors) ? p.authors.join(', ') : String(p.authors || 'Unknown Authors');
                  return (
                    <div key={p.id} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:border-accent/40 transition-all flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-accent text-[10px] font-bold">
                            {p.source || 'ARXIV'}
                          </span>
                          {p.year && <span className="text-[10px] font-mono text-slate-400">Published: {p.year}</span>}
                        </div>
                        <h4 className="text-base font-bold text-slate-900 line-clamp-2">{p.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{authorsStr}</p>
                        {p.abstractText && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.abstractText}</p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="text-[10px] font-mono text-slate-400">Qdrant Vector Indexed</span>
                        {p.pdfUrl && (
                          <a
                            href={p.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-accent hover:underline text-xs"
                          >
                            PDF <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EVIDENCE BRIEF / REPORT */}
        {tab === 'report' && (
          <div>
            {loadingReport ? (
              <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
                <div className="w-9 h-9 rounded-full bg-indigo-50 text-accent mx-auto flex items-center justify-center animate-spin">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-500">Loading synthesized evidence brief…</p>
              </div>
            ) : !report ? (
              <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-accent mx-auto flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-base font-bold text-slate-900">No Report Synthesized Yet</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Execute the research pipeline to discover literature, extract evidence, and generate the final Markdown synthesis brief.
                  </p>
                </div>
                <Button
                  onClick={handleRunPipeline}
                  disabled={runningPipeline}
                  className="h-10 px-5 rounded-xl bg-accent text-white text-xs font-bold shadow-sm"
                >
                  {runningPipeline ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                  Generate Evidence Brief
                </Button>
              </div>
            ) : (
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Synthesized Markdown Evidence Brief</h3>
                      <p className="text-xs text-slate-500">Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                    Markdown Synthesis Ready
                  </span>
                </div>

                <div className="prose prose-slate prose-xs max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {report.content}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
