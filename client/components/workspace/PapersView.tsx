'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { PaperDTO } from '@/types/api.types';
import { api } from '@/lib/api';
import { ExternalLink, Search, FileText, ChevronDown, ChevronUp, Bookmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  projectId: string;
}

export function PapersView({ projectId }: Props) {
  const [papers, setPapers] = useState<PaperDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'SEMANTIC_SCHOLAR' | 'ARXIV'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.get<{ papers: PaperDTO[] }>(`/api/projects/${projectId}/papers`)
      .then((res) => {
        if (isMounted) {
          setPapers(res.papers || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch papers');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      if (sourceFilter !== 'ALL' && p.source !== sourceFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const inTitle = p.title.toLowerCase().includes(q);
      const inAuthors = p.authors.some((a) => a.toLowerCase().includes(q));
      const inAbstract = (p.abstractText || '').toLowerCase().includes(q);
      const inVenue = (p.venue || '').toLowerCase().includes(q);
      return inTitle || inAuthors || inAbstract || inVenue;
    });
  }, [papers, sourceFilter, search]);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-text-muted">
        Loading indexed research papers...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-accent-red/30 bg-accent-red/10 text-accent-red text-sm">
        {error}
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg border border-border bg-bg-surface text-text-muted">
        <FileText className="mx-auto h-8 w-8 text-text-muted opacity-50 mb-2" />
        <p className="font-medium text-text-primary">No papers discovered yet</p>
        <p className="text-xs mt-1">
          Papers will appear here once the Discovery and Ingestion agents run.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search papers by title, author, venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-bg-surface text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-text-muted mr-1">Source:</span>
          {(['ALL', 'SEMANTIC_SCHOLAR', 'ARXIV'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={cn(
                'px-2.5 py-1 rounded transition-colors',
                sourceFilter === s
                  ? 'bg-accent text-text-primary font-medium'
                  : 'bg-bg-subtle text-text-muted hover:text-text-primary'
              )}
            >
              {s === 'ALL' ? 'All' : s === 'SEMANTIC_SCHOLAR' ? 'Semantic Scholar' : 'arXiv'}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-text-muted">
        Showing {filteredPapers.length} of {papers.length} indexed papers
      </div>

      {/* Papers List */}
      <div className="divide-y divide-border rounded-lg border border-border bg-bg-surface overflow-hidden">
        {filteredPapers.map((paper) => {
          const isExpanded = expandedId === paper.id;
          return (
            <div key={paper.id} className="p-4 transition-colors hover:bg-bg-subtle/30">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded font-mono uppercase',
                        paper.source === 'ARXIV'
                          ? 'bg-accent-amber/15 text-accent-amber'
                          : 'bg-accent/15 text-accent'
                      )}
                    >
                      {paper.source === 'SEMANTIC_SCHOLAR' ? 'Semantic Scholar' : paper.source}
                    </span>
                    {paper.year && (
                      <span className="text-xs text-text-muted font-mono">{paper.year}</span>
                    )}
                    {paper.citationCount > 0 && (
                      <span className="text-xs text-text-muted">
                        • {paper.citationCount} citations
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-semibold text-text-primary leading-snug">
                    {paper.title}
                  </h4>

                  <p className="text-xs text-text-muted">
                    {paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown authors'}
                    {paper.venue ? ` — ${paper.venue}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {paper.pdfUrl && (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline px-2.5 py-1 rounded border border-border bg-bg-subtle"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      PDF
                    </a>
                  )}

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : paper.id)}
                    className="p-1.5 text-text-muted hover:text-text-primary rounded hover:bg-bg-subtle transition-colors"
                    title={isExpanded ? 'Collapse' : 'Expand details'}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Expandable abstract and structured summary */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border space-y-3 text-xs">
                  {paper.abstractText && (
                    <div>
                      <span className="font-semibold text-text-primary block mb-1">Abstract</span>
                      <p className="text-text-muted leading-relaxed whitespace-pre-line">
                        {paper.abstractText}
                      </p>
                    </div>
                  )}

                  {(paper.summaryProblem || paper.summaryMethod || paper.summaryResults || paper.summaryLimits) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {paper.summaryProblem && (
                        <div className="p-2.5 rounded bg-bg-subtle border border-border/50">
                          <span className="font-semibold text-text-primary block">Research Problem</span>
                          <p className="text-text-muted mt-0.5">{paper.summaryProblem}</p>
                        </div>
                      )}
                      {paper.summaryMethod && (
                        <div className="p-2.5 rounded bg-bg-subtle border border-border/50">
                          <span className="font-semibold text-text-primary block">Methodology</span>
                          <p className="text-text-muted mt-0.5">{paper.summaryMethod}</p>
                        </div>
                      )}
                      {paper.summaryResults && (
                        <div className="p-2.5 rounded bg-bg-subtle border border-border/50">
                          <span className="font-semibold text-text-primary block">Key Results</span>
                          <p className="text-text-muted mt-0.5">{paper.summaryResults}</p>
                        </div>
                      )}
                      {paper.summaryLimits && (
                        <div className="p-2.5 rounded bg-bg-subtle border border-border/50">
                          <span className="font-semibold text-text-primary block">Limitations</span>
                          <p className="text-text-muted mt-0.5">{paper.summaryLimits}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
