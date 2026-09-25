'use client';

import { useEffect, useState } from 'react';
import { Library, Search, BookOpen, ExternalLink, Database, RefreshCw, FolderKanban, Layers, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import type { ProjectDTO } from '@/types/api.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export interface LibraryPaper {
  id: string;
  projectId: string;
  projectName?: string;
  externalId: string;
  source: string;
  title: string;
  authors: string[];
  year?: number;
  pdfUrl?: string;
  citationCount?: number;
  abstractText?: string;
  createdAt?: string;
}

export default function LibraryPage() {
  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<LibraryPaper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserLibrary() {
      setLoading(true);
      try {
        const { projects } = await api.get<{ projects: ProjectDTO[] }>('/api/projects');
        const allPapers: LibraryPaper[] = [];

        for (const proj of projects || []) {
          try {
            const { papers: projPapers } = await api.get<{ papers: LibraryPaper[] }>(`/api/projects/${proj.id}/papers`);
            if (Array.isArray(projPapers)) {
              for (const p of projPapers) {
                allPapers.push({ ...p, projectName: proj.name });
              }
            }
          } catch {
            // No papers for this project yet
          }
        }
        setPapers(allPapers);
      } catch {
        setPapers([]);
      } finally {
        setLoading(false);
      }
    }

    loadUserLibrary();
  }, []);

  const filtered = papers.filter(p => {
    const authorsStr = Array.isArray(p.authors) ? p.authors.join(', ') : String(p.authors || '');
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      authorsStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.projectName && p.projectName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSource = selectedSource ? p.source === selectedSource : true;
    return matchesSearch && matchesSource;
  });

  const sources = Array.from(new Set(papers.map(p => p.source).filter(Boolean)));

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
            <Library className="w-3.5 h-3.5 text-accent" />
            <span>Academic Paper Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Vector-Indexed Literature Library ({papers.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Explore 1536-dimensional vector embeddings, arXiv full-text preprints, and Semantic Scholar metadata ingested across your workspace.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-mono text-slate-600 shadow-2xs shrink-0 relative z-10">
          <Database className="w-4 h-4 text-accent" />
          <span>Qdrant Vector DB Active</span>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search indexed papers by title, author, or project..."
            className="pl-10 h-10 rounded-xl border-slate-200 text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent bg-slate-50/50 focus:bg-white transition-all shadow-2xs"
          />
        </div>

        {/* Source Filter Buttons */}
        {sources.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => setSelectedSource(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedSource === null
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              All Sources ({papers.length})
            </button>

            {sources.map(src => (
              <button
                key={src}
                onClick={() => setSelectedSource(src === selectedSource ? null : src)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedSource === src
                    ? 'bg-white text-accent shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {src} ({papers.filter(p => p.source === src).length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. PAPERS DISPLAY GRID */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
          <div className="w-9 h-9 rounded-full bg-indigo-50 text-accent mx-auto flex items-center justify-center animate-spin">
            <RefreshCw className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading indexed research papers from your workspace…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-accent mx-auto flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-slate-900">No Indexed Papers Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery ? 'No papers match your search filter.' : 'Start a research project or search literature on the Dashboard to discover and index papers automatically.'}
            </p>
          </div>
          {!searchQuery && (
            <Link href="/projects">
              <Button className="h-10 px-5 rounded-xl bg-accent text-white text-xs font-bold shadow-sm">
                + Go to Projects & Ingest Papers
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(paper => {
            const authorsStr = Array.isArray(paper.authors) ? paper.authors.join(', ') : String(paper.authors || 'Unknown Authors');
            return (
              <div
                key={paper.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:border-accent/40 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-accent text-[10px] font-bold">
                      {paper.source || 'ARXIV'}
                    </span>
                    {paper.projectName && (
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <FolderKanban className="w-3 h-3 text-slate-400" />
                        {paper.projectName}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-accent transition-colors line-clamp-2">
                    {paper.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{authorsStr}</p>
                  {paper.abstractText && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {paper.abstractText}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    {paper.year && (
                      <span className="font-mono text-[11px] text-slate-400">
                        Year: <strong className="text-slate-700">{paper.year}</strong>
                      </span>
                    )}
                    {typeof paper.citationCount === 'number' && (
                      <span className="font-mono text-[11px] text-slate-400">
                        Citations: <strong className="text-slate-700">{paper.citationCount}</strong>
                      </span>
                    )}
                  </div>

                  {paper.pdfUrl ? (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-accent hover:underline text-xs"
                    >
                      View Paper PDF <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">Indexed in Vector DB</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
