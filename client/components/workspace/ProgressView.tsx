'use client';

import React from 'react';
import type { AgentRunDTO, ProjectStatusDTO } from '@/types/api.types';
import { CheckCircle2, Clock, Loader2, AlertTriangle, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  status: ProjectStatusDTO;
  agentStages: AgentRunDTO[];
  discoveredCount: number;
  gapsCount: number;
  isStreaming: boolean;
  error: string | null;
  onRetry?: () => void;
}

const STAGE_DESCRIPTIONS: Record<string, string> = {
  DISCOVERY: 'Querying Semantic Scholar and arXiv academic APIs for candidate literature',
  INGESTION: 'Extracting PDF text chunks, computing embeddings, and indexing into isolated Qdrant vector store',
  ANALYSIS: 'Extracting research problems, methodologies, datasets, findings, and limitations',
  GAPS: 'Detecting underexplored literature intersections and cross-validating research gaps across papers',
  REPORT: 'Synthesizing evidence-backed academic research report with verified inline citations'
};

export function ProgressView({
  status,
  agentStages,
  discoveredCount,
  gapsCount,
  isStreaming,
  error,
  onRetry
}: Props) {
  const isComplete = status === 'COMPLETE';
  const isFailed = status === 'ERROR';

  return (
    <div className="space-y-6">
      {/* Live Stream Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border border-border bg-bg-surface">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            {isStreaming && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
            )}
            <span
              className={cn(
                'relative inline-flex rounded-full h-3 w-3',
                isComplete
                  ? 'bg-accent-green'
                  : isFailed
                  ? 'bg-accent-red'
                  : isStreaming
                  ? 'bg-accent-green'
                  : 'bg-text-muted'
              )}
            />
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary">
              Status: <span className="font-semibold capitalize">{status.toLowerCase()}</span>
            </div>
            <p className="text-xs text-text-muted">
              {isStreaming
                ? 'Listening to real-time research events'
                : isComplete
                ? 'All autonomous agents completed successfully'
                : isFailed
                ? 'Pipeline stopped due to an error'
                : 'Connection waiting'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-text-muted block">Papers Discovered</span>
            <span className="font-semibold text-text-primary text-base">{discoveredCount}</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span className="text-xs uppercase tracking-wider text-text-muted block">Candidate Gaps</span>
            <span className="font-semibold text-text-primary text-base">{gapsCount}</span>
          </div>
        </div>
      </div>

      {/* Error Alert if failed with Retry button */}
      {(error || isFailed) && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-accent-red/30 bg-accent-red/10 text-accent-red">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold">Workflow Error</div>
              <p className="text-xs mt-1">{error || 'The research pipeline stopped due to an error.'}</p>
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-accent-red text-white hover:bg-accent-red/90 transition-colors"
            >
              Retry Research
            </button>
          )}
        </div>
      )}

      {/* Pipeline Stages */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Autonomous Agent Pipeline
        </h3>
        <div className="divide-y divide-border rounded-lg border border-border bg-bg-surface overflow-hidden">
          {agentStages.map((stage, idx) => {
            const isStageComplete = stage.status === 'COMPLETE';
            const isStageRunning = stage.status === 'RUNNING';
            const isStageError = stage.status === 'ERROR';

            return (
              <div
                key={stage.agentName}
                className={cn(
                  'flex items-start justify-between p-4 transition-colors',
                  isStageRunning && 'bg-bg-subtle/50'
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5">
                    {isStageComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-accent-green" />
                    ) : isStageRunning ? (
                      <Loader2 className="h-5 w-5 text-accent animate-spin" />
                    ) : isStageError ? (
                      <AlertTriangle className="h-5 w-5 text-accent-red" />
                    ) : (
                      <Clock className="h-5 w-5 text-text-muted opacity-50" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-text-muted">0{idx + 1}</span>
                      <h4 className="text-sm font-medium text-text-primary">{stage.agentName}</h4>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded font-mono',
                          isStageComplete && 'bg-accent-green/15 text-accent-green',
                          isStageRunning && 'bg-accent/15 text-accent animate-pulse',
                          isStageError && 'bg-accent-red/15 text-accent-red',
                          !isStageComplete && !isStageRunning && !isStageError && 'bg-bg-subtle text-text-muted'
                        )}
                      >
                        {stage.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      {STAGE_DESCRIPTIONS[stage.agentName] || stage.agentName}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-text-muted">
                  {stage.durationMs ? `${(stage.durationMs / 1000).toFixed(1)}s` : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
