'use client';

import React, { useEffect, useState } from 'react';
import type { ReportDTO } from '@/types/api.types';
import { api } from '@/lib/api';
import { Download, FileDown, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  projectId: string;
}

export function ReportView({ projectId }: Props) {
  const [report, setReport] = useState<ReportDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingMd, setDownloadingMd] = useState<boolean>(false);
  const [downloadingBib, setDownloadingBib] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.get<{ report: ReportDTO }>(`/api/projects/${projectId}/report`)
      .then((res) => {
        if (isMounted) {
          setReport(res.report);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Report not available');
          setLoading(false);
        }
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
    } catch (err) {
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
    } catch (err) {
      alert('Failed to export BibTeX bibliography');
    } finally {
      setDownloadingBib(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-text-muted">
        Loading synthesized research report...
      </div>
    );
  }

  if (!report || !report.content) {
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

      {/* Rendered Document Container */}
      <div className="p-6 md:p-8 rounded-lg border border-border bg-bg-surface font-sans leading-relaxed text-text-primary text-sm space-y-4">
        {report.content.split('\n\n').map((block, idx) => {
          const trimmed = block.trim();
          if (!trimmed) return null;

          if (trimmed.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-2xl font-bold tracking-tight text-text-primary border-b border-border pb-2 pt-2">
                {trimmed.replace(/^#\s+/, '')}
              </h1>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-lg font-semibold text-text-primary pt-3 pb-1 border-b border-border/50">
                {trimmed.replace(/^##\s+/, '')}
              </h2>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-medium text-text-primary pt-2">
                {trimmed.replace(/^###\s+/, '')}
              </h3>
            );
          }
          if (trimmed.startsWith('> ')) {
            return (
              <blockquote key={idx} className="p-3 pl-4 border-l-2 border-accent bg-bg-subtle text-text-muted italic rounded-r text-xs">
                {trimmed.replace(/^>\s+/, '')}
              </blockquote>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const items = trimmed.split('\n').filter(Boolean);
            return (
              <ul key={idx} className="list-disc pl-5 space-y-1 text-text-muted text-xs">
                {items.map((item, iIdx) => (
                  <li key={iIdx}>{item.replace(/^[-*]\s+/, '')}</li>
                ))}
              </ul>
            );
          }

          return (
            <p key={idx} className="text-text-muted text-xs md:text-sm leading-relaxed whitespace-pre-line">
              {trimmed}
            </p>
          );
        })}
      </div>
    </div>
  );
}
