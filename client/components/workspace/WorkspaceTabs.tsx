'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type Tab = 'progress' | 'papers' | 'report';

export function WorkspaceTabs({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<Tab>('progress');
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
          <p className="text-text-muted">
            The research pipeline will run here once Phase 2 is wired up. Project ID: <code className="font-mono">{projectId}</code>
          </p>
        )}
        {tab === 'papers' && <p className="text-text-muted">Papers will appear here as the Discovery Agent runs.</p>}
        {tab === 'report' && <p className="text-text-muted">No report yet. Complete a research project to generate one.</p>}
      </div>
    </div>
  );
}
