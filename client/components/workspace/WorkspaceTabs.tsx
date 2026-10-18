'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useResearchJob } from '@/hooks/useResearchJob';
import { ProgressView } from './ProgressView';
import { PapersView } from './PapersView';
import { GapsView } from './GapsView';
import { ReportView } from './ReportView';
import { AskView } from './AskView';
import { Activity, FileText, Sparkles, BookOpen, MessageSquare } from 'lucide-react';

export type WorkspaceTab = 'progress' | 'papers' | 'gaps' | 'report' | 'ask';

interface TabItem {
  id: WorkspaceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

export function WorkspaceTabs({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<WorkspaceTab>('progress');
  const job = useResearchJob(projectId);

  const tabs: TabItem[] = [
    { id: 'progress', label: 'Pipeline', icon: Activity },
    { id: 'papers', label: 'Papers', icon: FileText, count: job.discoveredCount },
    { id: 'gaps', label: 'Research Gaps', icon: Sparkles, count: job.gapsCount },
    { id: 'report', label: 'Report', icon: BookOpen },
    { id: 'ask', label: 'Ask Assistant', icon: MessageSquare }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div role="tablist" className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;

          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-medium transition-colors whitespace-nowrap border-b-2',
                isActive
                  ? 'border-accent text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-accent' : 'text-text-muted')} />
              <span>{t.label}</span>
              {typeof t.count === 'number' && t.count > 0 && (
                <span
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.2 rounded-full',
                    isActive ? 'bg-accent/20 text-accent font-semibold' : 'bg-bg-subtle text-text-muted'
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div>
        {tab === 'progress' && (
          <ProgressView
            status={job.status}
            agentStages={job.agentStages}
            discoveredCount={job.discoveredCount}
            gapsCount={job.gapsCount}
            isStreaming={job.isStreaming}
            error={job.error}
          />
        )}
        {tab === 'papers' && <PapersView projectId={projectId} />}
        {tab === 'gaps' && <GapsView projectId={projectId} />}
        {tab === 'report' && <ReportView projectId={projectId} />}
        {tab === 'ask' && <AskView projectId={projectId} />}
      </div>
    </div>
  );
}
