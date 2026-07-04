'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { ProjectDTO } from '@/types/api.types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectDTO[] | null>(null);
  useEffect(() => {
    api.get<{ projects: ProjectDTO[] }>('/api/projects').then(res => setProjects(res.projects));
  }, []);

  if (projects === null) return <p className="text-text-muted">Loading…</p>;
  if (projects.length === 0) return <p className="text-text-muted">No projects yet.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <ul className="divide-y divide-border border border-border rounded-lg bg-bg-surface">
        {projects.map(p => (
          <li key={p.id}>
            <Link href={`/projects/${p.id}`} className="p-4 flex justify-between hover:bg-bg-subtle">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-sm text-text-muted">{p.topic.slice(0, 80)}</div>
              </div>
              <div className="text-sm text-text-muted">{p.status}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
