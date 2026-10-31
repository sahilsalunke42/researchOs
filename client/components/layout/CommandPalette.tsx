'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LayoutDashboard, FolderKanban, FileText, Library, Settings, Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { ProjectDTO } from '@/types/api.types';

interface Props {
  open: boolean;
  onOpenChange(open: boolean): void;
  onNewProject?: () => void;
}

export function CommandPalette({ open, onOpenChange, onNewProject }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<ProjectDTO[]>([]);

  useEffect(() => {
    if (open) {
      setQuery('');
      api.get<{ projects: ProjectDTO[] }>('/api/projects')
        .then((res) => setProjects(res.projects || []))
        .catch(() => setProjects([]));
    }
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.topic && p.topic.toLowerCase().includes(query.toLowerCase()))
  );

  function navigate(path: string) {
    onOpenChange(false);
    router.push(path);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in-0 duration-150">
      <div
        className="relative w-full max-w-xl rounded-lg border border-border bg-bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-label="Command search"
      >
        <div className="flex items-center px-4 border-b border-border">
          <Search className="h-4 w-4 text-text-muted shrink-0" />
          <input
            type="text"
            className="w-full h-12 px-3 text-sm bg-transparent border-0 outline-none placeholder:text-text-muted text-text-primary"
            placeholder="Search projects, documents, or navigation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded text-text-muted hover:text-text-primary"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/50 text-xs">
          {/* Quick Actions */}
          <div className="py-1">
            <div className="px-2 py-1 text-[11px] font-mono text-text-muted uppercase tracking-wider">
              Navigation
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-bg-subtle text-left text-text-primary"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-accent" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-bg-subtle text-left text-text-primary"
            >
              <FolderKanban className="h-3.5 w-3.5 text-accent" />
              <span>Projects</span>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-bg-subtle text-left text-text-primary"
            >
              <FileText className="h-3.5 w-3.5 text-accent" />
              <span>Reports</span>
            </button>
            <button
              onClick={() => navigate('/library')}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-bg-subtle text-left text-text-primary"
            >
              <Library className="h-3.5 w-3.5 text-accent" />
              <span>Library</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-bg-subtle text-left text-text-primary"
            >
              <Settings className="h-3.5 w-3.5 text-accent" />
              <span>Settings</span>
            </button>
          </div>

          {/* Projects Match */}
          {filteredProjects.length > 0 && (
            <div className="py-1">
              <div className="px-2 py-1 text-[11px] font-mono text-text-muted uppercase tracking-wider">
                Matching Projects ({filteredProjects.length})
              </div>
              {filteredProjects.slice(0, 5).map((project) => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-bg-subtle text-left text-text-primary"
                >
                  <div className="truncate pr-2">
                    <span className="font-medium">{project.name}</span>
                    {project.topic && (
                      <span className="text-text-muted ml-2 text-[11px] truncate">
                        {project.topic}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] shrink-0 text-text-muted">
                    {project.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {query && filteredProjects.length === 0 && (
            <div className="py-6 text-center text-text-muted text-xs">
              No matching projects found for &quot;{query}&quot;
            </div>
          )}
        </div>

        <div className="px-3 py-2 border-t border-border bg-bg-subtle flex items-center justify-between text-[11px] text-text-muted font-mono">
          <span>Navigate with ↵ Enter</span>
          <span>Close with ESC</span>
        </div>
      </div>
    </div>
  );
}
