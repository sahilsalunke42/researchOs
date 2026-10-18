'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { ProjectDTO, ReportDTO } from '@/types/api.types';
import { BookOpen, ArrowRight, Download, FileDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectWithReport {
  project: ProjectDTO;
  report: ReportDTO;
}

export default function ReportsPage() {
  const [reportsList, setReportsList] = useState<ProjectWithReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.get<{ projects: ProjectDTO[] }>('/api/projects')
      .then(async (res) => {
        if (!isMounted) return;
        const projects = res.projects || [];

        const reportsPromises = projects.map(async (p) => {
          try {
            const reportRes = await api.get<{ report: ReportDTO }>(`/api/projects/${p.id}/report`);
            if (reportRes.report && reportRes.report.content) {
              return { project: p, report: reportRes.report };
            }
          } catch {
            return null;
          }
          return null;
        });

        const resolved = (await Promise.all(reportsPromises)).filter(Boolean) as ProjectWithReport[];
        if (isMounted) {
          setReportsList(resolved);
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

  async function downloadExport(projectId: string, type: 'markdown' | 'bibtex') {
    try {
      const ext = type === 'markdown' ? 'md' : 'bib';
      const mime = type === 'markdown' ? 'text/markdown' : 'application/x-bibtex';
      const text = await api.getText(`/api/projects/${projectId}/export/${type}`);
      const blob = new Blob([text], { type: `${mime};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research_${type}_${projectId.slice(0, 8)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert(`Failed to export ${type}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Research Reports</h1>
        <p className="text-xs text-text-muted mt-1">
          Synthesized academic intelligence reports with ground-truth citations
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-text-muted">Loading research reports...</div>
      ) : reportsList.length === 0 ? (
        <div className="p-8 text-center rounded-lg border border-border bg-bg-surface text-text-muted">
          <BookOpen className="mx-auto h-8 w-8 text-text-muted opacity-50 mb-2" />
          <p className="font-medium text-text-primary">No reports generated yet</p>
          <p className="text-xs mt-1">
            Reports are produced automatically when research projects finish their analysis pipeline.
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline mt-4"
          >
            Go to Projects <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-text-muted">
            {reportsList.length} completed research {reportsList.length === 1 ? 'report' : 'reports'}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reportsList.map(({ project, report }) => (
              <div
                key={report.id}
                className="p-5 rounded-lg border border-border bg-bg-surface space-y-3 transition-colors hover:border-border/80"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-text-primary">
                      {project.name}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                      {project.topic}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadExport(project.id, 'markdown')}
                      className="text-xs h-8"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Markdown
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadExport(project.id, 'bibtex')}
                      className="text-xs h-8"
                    >
                      <FileDown className="h-3 w-3 mr-1" />
                      BibTeX
                    </Button>
                    <Link href={`/projects/${project.id}`}>
                      <Button size="sm" className="text-xs h-8">
                        View Workspace
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="p-3 rounded bg-bg-subtle text-xs text-text-muted line-clamp-3 font-sans leading-relaxed">
                  {report.content.slice(0, 400)}...
                </div>

                <div className="flex items-center gap-4 text-[11px] text-text-muted pt-1 border-t border-border/50">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Generated {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>Status: Complete</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
