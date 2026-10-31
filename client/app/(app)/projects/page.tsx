'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { ProjectDTO } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { NewProjectModal } from '@/components/workspace/NewProjectModal';
import { Plus, ArrowRight, Search, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectDTO[] | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    api.get<{ projects: ProjectDTO[] }>('/api/projects')
      .then((res) => setProjects(res.projects || []))
      .catch(() => setProjects([]));
  }, []);

  const filtered = useMemo(() => {
    if (!projects) return [];
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.topic && p.topic.toLowerCase().includes(q))
    );
  }, [projects, search]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Research Projects
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono">
            {projects ? `${projects.length} Total Projects Catalogued` : 'Loading catalog...'}
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="h-9 px-4 text-xs font-medium bg-accent text-white hover:bg-accent/90 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New Project
        </Button>
      </div>

      {projects && projects.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Filter by name or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-bg-surface text-xs text-text-primary outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
      )}

      {projects === null && (
        <div className="p-8 rounded-lg border border-border bg-bg-surface text-center text-xs font-mono text-text-muted animate-pulse">
          Loading project catalog...
        </div>
      )}

      {projects && projects.length === 0 && (
        <div className="p-12 text-center rounded-lg border border-border bg-bg-surface space-y-3">
          <FolderKanban className="h-8 w-8 mx-auto text-text-muted/60" />
          <h2 className="text-sm font-semibold text-text-primary">No research projects yet</h2>
          <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
            Create your first project to discover scientific literature, extract evidence, and validate research gaps.
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            className="h-9 px-4 text-xs bg-accent text-white hover:bg-accent/90 mt-2"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create Project
          </Button>
        </div>
      )}

      {projects && projects.length > 0 && (
        <div className="border border-border rounded-lg bg-bg-surface overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-bg-subtle/50 text-text-muted font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-medium">Project Name & Topic</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Corpus Limit</th>
                  <th className="py-2.5 px-4 font-medium">Updated</th>
                  <th className="py-2.5 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((p) => {
                  const isDone = p.status === 'COMPLETE';
                  const isError = p.status === 'ERROR';
                  const isActive = !isDone && !isError && p.status !== 'QUEUED';

                  return (
                    <tr key={p.id} className="hover:bg-bg-subtle/40 transition-colors group">
                      <td className="py-3 px-4">
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-medium text-text-primary group-hover:text-accent transition-colors block"
                        >
                          {p.name}
                        </Link>
                        {p.topic && (
                          <span className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                            {p.topic}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border font-medium',
                            isDone && 'text-accent-green bg-accent-green/15 border-accent-green/20',
                            isError && 'text-accent-red bg-accent-red/15 border-accent-red/20',
                            isActive && 'text-accent-amber bg-accent-amber/15 border-accent-amber/20',
                            p.status === 'QUEUED' && 'text-text-muted bg-bg-subtle border-border'
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              isDone && 'bg-accent-green',
                              isError && 'bg-accent-red',
                              isActive && 'bg-accent-amber animate-pulse',
                              p.status === 'QUEUED' && 'bg-text-muted'
                            )}
                          />
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-text-muted tabular-nums whitespace-nowrap">
                        {p.paperLimit} papers
                      </td>
                      <td className="py-3 px-4 font-mono text-text-muted tabular-nums whitespace-nowrap">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/projects/${p.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                        >
                          Workspace
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NewProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(newP) => {
          setProjects((prev) => [newP, ...(prev || [])]);
          router.push(`/projects/${newP.id}`);
        }}
      />
    </div>
  );
}
