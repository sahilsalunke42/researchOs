'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { ProjectDTO } from '@/types/api.types';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { NewProjectModal } from '@/components/workspace/NewProjectModal';

const ACTIVE = new Set(['QUEUED', 'DISCOVERING', 'INGESTING', 'REPORTING']);

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectDTO[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    api.get<{ projects: ProjectDTO[] }>('/api/projects').then((res) => setProjects(res.projects));
  }, []);

  const active = projects?.filter(p => ACTIVE.has(p.status)) ?? [];
  const recent = projects?.filter(p => p.status === 'COMPLETE').slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button onClick={() => setModalOpen(true)}>+ New Project</Button>
      </div>

      {projects === null && <p className="text-text-muted">Loading…</p>}

      {projects && projects.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-muted mb-4">You have no projects yet. Start your first research.</p>
          <Button onClick={() => setModalOpen(true)}>+ New Project</Button>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wide text-text-muted mb-3">Active</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wide text-text-muted mb-3">Recent</h2>
          <ul className="divide-y divide-border border border-border rounded-lg bg-bg-surface">
            {recent.map(p => (
              <li key={p.id} className="p-3 text-sm flex justify-between">
                <span>{p.name}</span>
                <span className="text-text-muted">{new Date(p.updatedAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <NewProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={(project) => router.push(`/projects/${project.id}`)}
      />
    </div>
  );
}
