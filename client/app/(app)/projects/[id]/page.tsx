'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, FolderKanban, Clock, CheckCircle2, Database, BrainCircuit, RefreshCw, Play, Sparkles } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { WorkspaceTabs } from '@/components/workspace/WorkspaceTabs';
import type { ProjectDTO } from '@/types/api.types';
import { Button } from '@/components/ui/button';

export default function ProjectWorkspacePage() {
  const params = useParams();
  const projectId = typeof params?.id === 'string' ? params.id : '';
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  function fetchProject() {
    if (!projectId) return;
    api.get<{ project: ProjectDTO }>(`/api/projects/${projectId}`)
      .then(res => setProject(res.project))
      .catch(err => setError(err instanceof ApiError ? err.message : 'Failed to load project workspace'));
  }

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  async function handleRunResearch() {
    if (!projectId || running) return;
    setRunning(true);
    try {
      await api.post(`/api/projects/${projectId}/research`, {});
      fetchProject();
    } catch {
      // Error handling
    } finally {
      setRunning(false);
    }
  }

  if (error) {
    return (
      <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
        <p className="text-sm font-bold text-rose-700">{error}</p>
        <Link href="/projects" className="inline-block text-xs font-semibold text-accent hover:underline">
          ← Back to Projects Workspace
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
        <div className="w-9 h-9 rounded-full bg-indigo-50 text-accent mx-auto flex items-center justify-center animate-spin">
          <RefreshCw className="w-4 h-4" />
        </div>
        <p className="text-xs font-semibold text-slate-500">Loading research workspace investigation…</p>
      </div>
    );
  }

  const isComplete = project.status === 'COMPLETE';

  return (
    <div className="w-full space-y-8 animate-fade-in-up pb-12">
      {/* Back Navigation Button */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Research Workspace Projects
        </Link>
      </div>

      {/* HERO OVERVIEW CARD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-white via-indigo-50/60 to-slate-50 border border-slate-200/90 shadow-2xs relative overflow-hidden group">
        {/* Ambient Radial Glow */}
        <div
          className="absolute -right-12 -top-12 w-72 h-72 pointer-events-none opacity-50 group-hover:opacity-75 transition-opacity duration-500"
          style={{ background: 'radial-gradient(circle, rgba(79, 70, 229, 0.18) 0%, transparent 70%)' }}
        />

        <div className="space-y-3 relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-accent-light text-accent text-[11px] font-bold tracking-tight inline-flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5" /> Research Investigation
            </span>

            {isComplete ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Synthesis Complete
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-bold inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" /> Status: {project.status}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {project.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Topic: {project.topic}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-accent" /> Paper Capacity: <strong>{project.paperLimit} papers</strong>
            </span>
            <span>•</span>
            <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          {!isComplete && (
            <Button
              onClick={handleRunResearch}
              disabled={running}
              className="h-11 px-5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/25 hover:-translate-y-0.5 transition-all duration-200"
            >
              {running ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Ingesting & Synthesizing…
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2 fill-current" /> Run Research Pipeline
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* WORKSPACE TABS VIEW */}
      <WorkspaceTabs projectId={project.id} projectStatus={project.status} onReload={fetchProject} />
    </div>
  );
}
