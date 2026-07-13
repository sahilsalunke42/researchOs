'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { WorkspaceTabs } from '@/components/workspace/WorkspaceTabs';
import type { ProjectDTO } from '@/types/api.types';

export default function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ project: ProjectDTO }>(`/api/projects/${params.id}`)
      .then(res => setProject(res.project))
      .catch(err => setError(err instanceof ApiError ? err.message : 'Failed to load'));
  }, [params.id]);

  if (error) return <p className="text-accent-red">{error}</p>;
  if (!project) return <p className="text-text-muted">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/projects" className="text-sm text-text-muted hover:underline">← Projects</Link>
          <h1 className="text-2xl font-semibold mt-1">{project.name}</h1>
        </div>
      </div>
      <WorkspaceTabs projectId={project.id} />
    </div>
  );
}
