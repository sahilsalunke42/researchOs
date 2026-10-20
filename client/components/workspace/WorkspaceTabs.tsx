'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useResearchJob } from '@/hooks/useResearchJob';
import { ProgressView } from './ProgressView';
import { PapersView } from './PapersView';
import { GapsView } from './GapsView';
import { ReportView } from './ReportView';
import { AskView } from './AskView';
import { Activity, FileText, Sparkles, BookOpen, MessageSquare, CheckCircle2, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type WorkspaceTab = 'progress' | 'papers' | 'gaps' | 'report' | 'ask';

interface TabItem {
  id: WorkspaceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

export function WorkspaceTabs({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<WorkspaceTab>('progress');
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const hasTriggeredModalRef = useRef<boolean>(false);
  const job = useResearchJob(projectId);

  // Trigger completion pop up once when pipeline reaches COMPLETE status
  useEffect(() => {
    if (job.status === 'COMPLETE' && !hasTriggeredModalRef.current) {
      const storageKey = `research_complete_dismissed_${projectId}`;
      const alreadyDismissed = typeof window !== 'undefined' && sessionStorage.getItem(storageKey);
      if (!alreadyDismissed) {
        setShowCompletionModal(true);
        hasTriggeredModalRef.current = true;
      }
    }
  }, [job.status, projectId]);

  function handleCloseModal() {
    setShowCompletionModal(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`research_complete_dismissed_${projectId}`, 'true');
    }
  }

  function handleViewReport() {
    handleCloseModal();
    setTab('report');
  }

  function handleViewGaps() {
    handleCloseModal();
    setTab('gaps');
  }

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

      {/* Pipeline Completion Pop Up Modal */}
      <Dialog open={showCompletionModal} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-md bg-bg-surface border border-border">
          <DialogHeader className="text-center sm:text-center items-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-green/15 text-accent-green mb-3 ring-8 ring-accent-green/5">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-text-primary">
              Research Pipeline Complete!
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted mt-1 leading-relaxed max-w-sm">
              All autonomous research agents have completed processing your literature corpus. Paper summaries, validated gaps, and intelligence reports are ready.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 py-3">
            <div className="p-3 rounded-lg bg-bg-subtle/80 border border-border/60 text-center space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium block">
                Papers
              </span>
              <span className="text-lg font-bold text-text-primary">{job.discoveredCount}</span>
            </div>
            <div className="p-3 rounded-lg bg-bg-subtle/80 border border-border/60 text-center space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium block">
                Gaps
              </span>
              <span className="text-lg font-bold text-accent">{job.gapsCount}</span>
            </div>
            <div className="p-3 rounded-lg bg-bg-subtle/80 border border-border/60 text-center space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium block">
                Report
              </span>
              <span className="text-sm font-semibold text-accent-green block mt-1">Ready</span>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={handleViewReport}
              className="flex-1 bg-accent text-text-primary hover:bg-accent/90"
            >
              <BookOpen className="h-4 w-4 mr-1.5" />
              View Report
            </Button>
            <Button
              variant="outline"
              onClick={handleViewGaps}
              className="flex-1 border-border text-text-primary hover:bg-bg-subtle"
            >
              <Sparkles className="h-4 w-4 mr-1.5 text-accent" />
              Explore Gaps
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
