'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { ProjectDTO, PaperDTO } from '@/types/api.types';
import { Search, BookOpen, ExternalLink, ArrowRight, FolderGit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EnrichedPaper extends PaperDTO {
  projectName: string;
}

export default function LibraryPage() {
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [papers, setPapers] = useState<EnrichedPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'SEMANTIC_SCHOLAR' | 'ARXIV'>('ALL');

  useEffect(() => {
    let isMounted = true;
    api.get<{ projects: ProjectDTO[] }>('/api/projects')
      .then(async (res) => {
        if (!isMounted) return;
        const projectList = res.projects || [];
        setProjects(projectList);

        // Fetch papers for each project in parallel
        const paperPromises = projectList.map(async (p) => {
          try {
            const paperRes = await api.get<{ papers: PaperDTO[] }>(`/api/projects/${p.id}/papers`);
            return (paperRes.papers || []).map((paper) => ({
              ...paper,
              projectName: p.name
            }));
          } catch {
            return [];
          }
        });

        const allPapersNested = await Promise.all(paperPromises);
        if (isMounted) {
          // Deduplicate by externalId if in multiple projects
          const seen = new Set<string>();
          const deduped: EnrichedPaper[] = [];
          for (const list of allPapersNested) {
            for (const item of list) {
              const key = item.externalId || item.id;
              if (!seen.has(key)) {
                seen.add(key);
                deduped.push(item);
              }
            }
          }
          setPapers(deduped);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return papers.filter((p) => {
      if (sourceFilter !== 'ALL' && p.source !== sourceFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.authors.some((a) => a.toLowerCase().includes(q)) ||
        p.projectName.toLowerCase().includes(q) ||
        (p.venue || '').toLowerCase().includes(q)
      );
    });
  }, [papers, search, sourceFilter]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Research Library</h1>
        <p className="text-xs text-text-muted mt-1 font-mono">
          Aggregated scientific pre-prints indexed across active and completed research projects
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Filter library by title, author, or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-bg-surface text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-text-muted text-[11px] uppercase mr-1">Source:</span>
          {(['ALL', 'SEMANTIC_SCHOLAR', 'ARXIV'] as const).map((s) => {
            const isActive = sourceFilter === s;
            return (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs transition-colors',
                  isActive
                    ? 'bg-accent text-white font-medium shadow-sm'
                    : 'bg-bg-subtle text-text-muted hover:text-text-primary border border-border'
                )}
              >
                {s === 'ALL' ? 'All' : s === 'SEMANTIC_SCHOLAR' ? 'Semantic Scholar' : 'arXiv'}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-text-muted animate-pulse">
          Loading indexed research literature...
        </div>
      ) : papers.length === 0 ? (
        <div className="p-10 text-center rounded-lg border border-border bg-bg-surface text-text-muted space-y-2">
          <BookOpen className="mx-auto h-6 w-6 text-text-muted/60" />
          <p className="font-semibold text-sm text-text-primary">No papers in library</p>
          <p className="text-xs max-w-md mx-auto leading-relaxed">
            Papers discovered during project research pipelines will automatically appear here.
          </p>
          <div className="pt-2">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
            >
              Go to Projects <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-text-muted font-mono">
            Showing <span className="tabular-nums font-semibold text-text-primary">{filtered.length}</span> of <span className="tabular-nums">{papers.length}</span> distinct papers
          </div>

          <div className="divide-y divide-border rounded-lg border border-border bg-bg-surface overflow-hidden shadow-sm">
            {filtered.map((paper) => (
              <div key={paper.id} className="p-4 transition-colors hover:bg-bg-subtle/30 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded font-mono font-medium uppercase border',
                          paper.source === 'ARXIV'
                            ? 'bg-accent-amber/15 text-accent-amber border-accent-amber/20'
                            : 'bg-accent/15 text-accent border-accent/20'
                        )}
                      >
                        {paper.source === 'SEMANTIC_SCHOLAR' ? 'Semantic Scholar' : paper.source}
                      </span>
                      {paper.year && (
                        <span className="text-xs text-text-muted font-mono tabular-nums">{paper.year}</span>
                      )}
                      <Link
                        href={`/projects/${paper.projectId}`}
                        className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary px-2 py-0.5 rounded bg-bg-subtle border border-border"
                      >
                        <FolderGit2 className="h-3 w-3" />
                        {paper.projectName}
                      </Link>
                    </div>

                    <h3 className="text-sm font-semibold text-text-primary leading-snug">
                      {paper.title}
                    </h3>

                    <p className="text-xs text-text-muted">
                      {paper.authors.length ? paper.authors.join(', ') : 'Unknown authors'}
                      {paper.venue ? ` • ${paper.venue}` : ''}
                    </p>
                  </div>

                  {paper.pdfUrl && (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline px-2.5 py-1 rounded border border-border bg-bg-subtle shrink-0 font-mono"
                    >
                      <ExternalLink className="h-3 w-3" />
                      PDF
                    </a>
                  )}
                </div>

                {paper.abstractText && (
                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                    {paper.abstractText}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
