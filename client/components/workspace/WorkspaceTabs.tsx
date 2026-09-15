'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useResearchJob } from '@/hooks/useResearchJob';
import { api, ApiError } from '@/lib/api';
import type { ProjectDTO } from '@/types/api.types';
import { Button } from '@/components/ui/button';

type Tab = 'progress' | 'papers' | 'report';

export function WorkspaceTabs({
  projectId,
  projectName,
  topic,
  paperLimit
}: {
  projectId: string;
  projectName: string;
  topic: string;
  paperLimit: 5 | 10 | 20;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('progress');
  const [restarting, setRestarting] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);
  const { status, agentStages, reportContent } = useResearchJob(projectId);

  async function restartSearch() {
    setRestarting(true);
    setRestartError(null);
    try {
      const { project } = await api.post<{ project: ProjectDTO }>('/api/projects', {
        name: projectName,
        topic,
        paperLimit
      });
      router.push(`/projects/${project.id}`);
    } catch (error) {
      setRestartError(error instanceof ApiError ? error.message : 'Failed to restart search');
    } finally {
      setRestarting(false);
    }
  }

  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-border">
        {(['progress', 'papers', 'report'] as const).map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm capitalize',
              tab === t ? 'border-b-2 border-accent text-text-primary font-medium' : 'text-text-muted hover:text-text-primary'
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="py-6">
        {tab === 'progress' && (
          <div className="space-y-3">
            <p className="text-text-muted">
              Status: <span className="font-medium text-text-primary">{status}</span>
            </p>
            {status === 'ERROR' && (
              <div className="space-y-2">
                <Button type="button" onClick={restartSearch} disabled={restarting}>
                  {restarting ? 'Restarting…' : 'Restart Search'}
                </Button>
                {restartError && <p role="alert" className="text-sm text-accent-red">{restartError}</p>}
              </div>
            )}
            {agentStages.length > 0 ? (
              <ul className="space-y-1 text-sm text-text-muted">
                {agentStages.map(stage => (
                  <li key={stage.id}>
                    {stage.agentName}: <span className="text-text-primary">{stage.status}</span>
                    {stage.errorMessage ? ` (${stage.errorMessage})` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-muted">Project ID: <code className="font-mono">{projectId}</code></p>
            )}
          </div>
        )}
        {tab === 'papers' && <p className="text-text-muted">Papers are ingested in the backend pipeline for this project.</p>}
        {tab === 'report' && (
          reportContent
            ? <pre className="whitespace-pre-wrap text-sm text-text-primary">{reportContent}</pre>
            : <p className="text-text-muted">No report yet. Complete a research project to generate one.</p>
        )}
      </div>
    </div>
  );
}
