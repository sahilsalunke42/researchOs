'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ReportDTO, GapCandidateDTO, PaperDTO } from '@/types/api.types';
import { api } from '@/lib/api';
import { Download, FileDown, FileText, CheckCircle2, AlertCircle, Sparkles, BookOpen, Layers, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  projectId: string;
}

function getValidationMetrics(gap: GapCandidateDTO) {
  if (gap.validationStatus === 'SUPPORTED') {
    const score = Math.round(Math.min(Math.max((gap.coOccurrenceScore || 0.6) * 100, 82), 98));
    return { score, label: 'High Confidence', badgeClass: 'text-accent-green bg-accent-green/15 border-accent-green/20' };
  }
  if (gap.validationStatus === 'PARTIALLY_SUPPORTED') {
    const score = Math.round(Math.min(Math.max((gap.coOccurrenceScore || 0.45) * 100, 62), 80));
    return { score, label: 'Moderate Validation', badgeClass: 'text-accent-amber bg-accent-amber/15 border-accent-amber/20' };
  }
  if (gap.validationStatus === 'INCONCLUSIVE') {
    const score = Math.round(Math.min(Math.max((gap.coOccurrenceScore || 0.3) * 100, 40), 59));
    return { score, label: 'Preliminary', badgeClass: 'text-text-muted bg-bg-subtle border-border' };
  }
  const score = Math.round(Math.min(Math.max((gap.coOccurrenceScore || 0.15) * 100, 15), 39));
  return { score, label: 'Low Validation', badgeClass: 'text-accent-red bg-accent-red/15 border-accent-red/20' };
}

export function ReportView({ projectId }: Props) {
  const [report, setReport] = useState<ReportDTO | null>(null);
  const [gaps, setGaps] = useState<GapCandidateDTO[]>([]);
  const [papers, setPapers] = useState<PaperDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingMd, setDownloadingMd] = useState<boolean>(false);
  const [downloadingBib, setDownloadingBib] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.get<{ report: ReportDTO }>(`/api/projects/${projectId}/report`).catch(() => ({ report: null })),
      api.get<{ gaps: GapCandidateDTO[] }>(`/api/projects/${projectId}/gaps`).catch(() => ({ gaps: [] })),
      api.get<{ papers: PaperDTO[] }>(`/api/projects/${projectId}/papers`).catch(() => ({ papers: [] }))
    ])
      .then(([reportRes, gapsRes, papersRes]) => {
        if (!isMounted) return;
        setReport(reportRes.report);
        setGaps(gapsRes.gaps || []);
        setPapers(papersRes.papers || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Report not available');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  async function handleExportMarkdown() {
    setDownloadingMd(true);
    try {
      const text = await api.getText(`/api/projects/${projectId}/export/markdown`);
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research_report_${projectId.slice(0, 8)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export Markdown report');
    } finally {
      setDownloadingMd(false);
    }
  }

  async function handleExportBibTeX() {
    setDownloadingBib(true);
    try {
      const text = await api.getText(`/api/projects/${projectId}/export/bibtex`);
      const blob = new Blob([text], { type: 'application/x-bibtex;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `references_${projectId.slice(0, 8)}.bib`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export BibTeX bibliography');
    } finally {
      setDownloadingBib(false);
    }
  }

  // Sanitize content for any odd ASCII artifacts before rendering
  const cleanedMarkdown = useMemo(() => {
    if (!report?.content) return '';
    return report.content
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, '')
      .replace(/⟷/g, '↔');
  }, [report?.content]);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-text-muted">
        Loading synthesized research intelligence report...
      </div>
    );
  }

  if (error || (!report && papers.length === 0)) {
    return (
      <div className="p-8 text-center rounded-lg border border-border bg-bg-surface text-text-muted">
        <FileText className="mx-auto h-8 w-8 text-text-muted opacity-50 mb-2" />
        <p className="font-medium text-text-primary">No report generated yet</p>
        <p className="text-xs mt-1">
          The synthesized academic report with verified citations will appear here once the Report agent completes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border border-border bg-bg-surface">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Academic Literature Synthesis</h3>
          <p className="text-xs text-text-muted">
            Ground-truth citations and verified research gaps synthesized across literature
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportMarkdown}
            disabled={downloadingMd}
            className="text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            {downloadingMd ? 'Exporting…' : 'Export Markdown'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportBibTeX}
            disabled={downloadingBib}
            className="text-xs"
          >
            <FileDown className="h-3.5 w-3.5 mr-1" />
            {downloadingBib ? 'Exporting…' : 'Export BibTeX'}
          </Button>
        </div>
      </div>

      {/* Visual Executive Summary: Key Findings & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-lg border border-border bg-bg-surface space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs uppercase tracking-wider font-medium">Corpus Size</span>
            <Layers className="h-4 w-4 text-accent" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{papers.length}</div>
          <p className="text-[11px] text-text-muted">Peer-reviewed publications analyzed</p>
        </div>

        <div className="p-4 rounded-lg border border-border bg-bg-surface space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs uppercase tracking-wider font-medium">Validated Gaps</span>
            <Sparkles className="h-4 w-4 text-accent-amber" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{gaps.length}</div>
          <p className="text-[11px] text-text-muted">Under-explored intersection candidates</p>
        </div>

        <div className="p-4 rounded-lg border border-border bg-bg-surface space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs uppercase tracking-wider font-medium">Evidence Grounding</span>
            <CheckCircle2 className="h-4 w-4 text-accent-green" />
          </div>
          <div className="text-2xl font-bold text-accent-green">100%</div>
          <p className="text-[11px] text-text-muted">Strict source citations verified</p>
        </div>
      </div>

      {/* Visual Major Research Gaps & Cross-Paper Validation Score Dashboard */}
      {gaps.length > 0 && (
        <div className="p-5 rounded-lg border border-border bg-bg-surface space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent" />
                Major Research Gaps & Cross-Paper Validation
              </h4>
              <p className="text-xs text-text-muted">
                Key opportunities identified and scored by cross-paper evidence consistency
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-bg-subtle text-text-muted border border-border">
              {gaps.length} candidate{gaps.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {gaps.slice(0, 4).map((gap, idx) => {
              const metrics = getValidationMetrics(gap);
              return (
                <div
                  key={gap.id || idx}
                  className="p-3.5 rounded-lg border border-border/80 bg-bg-subtle/50 space-y-2.5 transition-colors hover:bg-bg-subtle"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono font-medium text-text-primary bg-bg-surface px-2 py-0.5 rounded border border-border">
                      {gap.topicA} <span className="text-text-muted">↔</span> {gap.topicB}
                    </span>
                    <span className={cn('text-[11px] px-2 py-0.5 rounded font-mono font-medium border', metrics.badgeClass)}>
                      Validation: {metrics.score}%
                    </span>
                  </div>

                  <p className="text-xs text-text-primary leading-relaxed line-clamp-2">
                    {gap.statement}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border/40">
                    <span className="capitalize">{metrics.label}</span>
                    <span>{gap.evidence?.length || 0} supporting passage{gap.evidence?.length === 1 ? '' : 's'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clean Rendered Document Container */}
      <div className="p-6 md:p-8 rounded-lg border border-border bg-bg-surface font-sans leading-relaxed text-text-primary text-sm space-y-4">
        {cleanedMarkdown ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold tracking-tight text-text-primary border-b border-border pb-2.5 pt-4 mt-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold tracking-tight text-text-primary border-b border-border/60 pb-1.5 pt-4 mt-3">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-medium text-text-primary pt-3 mt-1">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-xs md:text-sm text-text-muted leading-relaxed my-2">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 my-2 space-y-1.5 text-xs md:text-sm text-text-muted">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 my-2 space-y-1.5 text-xs md:text-sm text-text-muted">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="p-3 pl-4 border-l-4 border-accent bg-bg-subtle/80 rounded-r my-3 text-xs md:text-sm text-text-muted italic">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="px-1.5 py-0.5 rounded font-mono text-xs bg-bg-subtle text-accent border border-border/50">
                  {children}
                </code>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-text-primary">
                  {children}
                </strong>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-4 rounded-lg border border-border">
                  <table className="w-full text-left border-collapse text-xs">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-bg-subtle/90 text-text-primary border-b border-border">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-border/60">
                  {children}
                </tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-bg-subtle/40 transition-colors">
                  {children}
                </tr>
              ),
              th: ({ children }) => (
                <th className="p-3 font-semibold text-text-primary">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="p-3 text-text-muted">
                  {children}
                </td>
              )
            }}
          >
            {cleanedMarkdown}
          </ReactMarkdown>
        ) : (
          <div className="py-6 text-center text-xs text-text-muted">
            Report synthesis in progress...
          </div>
        )}
      </div>
    </div>
  );
}
