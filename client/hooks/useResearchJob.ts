'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { AgentNameDTO, AgentRunDTO, AgentStatusDTO, ProjectDTO, ProjectStatusDTO } from '@/types/api.types';
import { api } from '@/lib/api';

const ORDERED_STAGES: AgentNameDTO[] = ['DISCOVERY', 'INGESTION', 'ANALYSIS', 'GAPS', 'REPORT'];

export interface UseResearchJobResult {
  status: ProjectStatusDTO;
  agentStages: AgentRunDTO[];
  discoveredCount: number;
  gapsCount: number;
  isStreaming: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useResearchJob(projectId: string): UseResearchJobResult {
  const [status, setStatus] = useState<ProjectStatusDTO>('QUEUED');
  const [agentStages, setAgentStages] = useState<AgentRunDTO[]>(() =>
    ORDERED_STAGES.map((name) => ({
      id: name.toLowerCase(),
      agentName: name,
      status: 'PENDING' as AgentStatusDTO,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      errorMessage: null
    }))
  );
  const [discoveredCount, setDiscoveredCount] = useState<number>(0);
  const [gapsCount, setGapsCount] = useState<number>(0);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await api.get<{ project: ProjectDTO }>(`/api/projects/${projectId}`);
      const p = res.project;
      setStatus(p.status);
      if (p.papers) setDiscoveredCount(p.papers.length);
      if (p.gapCandidates) setGapsCount(p.gapCandidates.length);

      if (p.agentRuns && p.agentRuns.length > 0) {
        setAgentStages((prev) =>
          prev.map((stage) => {
            const match = p.agentRuns?.find((r) => r.agentName === stage.agentName);
            return match || stage;
          })
        );
      } else if (p.status === 'COMPLETE') {
        setAgentStages((prev) =>
          prev.map((s) => ({ ...s, status: 'COMPLETE' as AgentStatusDTO }))
        );
      }
    } catch (err) {
      // Non-critical background refresh failure
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;

    // 1. Initial snapshot fetch
    refresh();

    // 2. Connect to SSE stream
    if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
      const es = new EventSource(`/api/projects/${projectId}/stream`, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isMounted) return;
        setIsStreaming(true);
      };

      es.addEventListener('stage.updated', (event: MessageEvent) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data) as { stage: AgentNameDTO; status: AgentStatusDTO };
          setAgentStages((prev) =>
            prev.map((s) =>
              s.agentName === data.stage
                ? {
                    ...s,
                    status: data.status,
                    startedAt: data.status === 'RUNNING' && !s.startedAt ? new Date().toISOString() : s.startedAt,
                    completedAt: data.status === 'COMPLETE' ? new Date().toISOString() : s.completedAt
                  }
                : s
            )
          );

          if (data.stage === 'DISCOVERY' && data.status === 'RUNNING') setStatus('DISCOVERING');
          if (data.stage === 'INGESTION' && data.status === 'RUNNING') setStatus('INGESTING');
          if ((data.stage === 'ANALYSIS' || data.stage === 'GAPS') && data.status === 'RUNNING') setStatus('ANALYZING');
          if (data.stage === 'REPORT' && data.status === 'RUNNING') setStatus('REPORTING');
        } catch {
          // Ignore malformed SSE payload
        }
      });

      es.addEventListener('paper.discovered', (_event: MessageEvent) => {
        if (!isMounted) return;
        setDiscoveredCount((c) => c + 1);
      });

      es.addEventListener('gap.detected', (_event: MessageEvent) => {
        if (!isMounted) return;
        setGapsCount((c) => c + 1);
      });

      es.addEventListener('report.completed', (_event: MessageEvent) => {
        if (!isMounted) return;
        setStatus('COMPLETE');
        setAgentStages((prev) =>
          prev.map((s) => ({
            ...s,
            status: 'COMPLETE' as AgentStatusDTO,
            completedAt: s.completedAt || new Date().toISOString()
          }))
        );
        setIsStreaming(false);
        refresh();
        es.close();
      });

      es.addEventListener('job.failed', (event: MessageEvent) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          setError(data.error || 'Research pipeline encountered an error');
        } catch {
          setError('Research pipeline encountered an error');
        }
        setStatus('ERROR');
        setIsStreaming(false);
        es.close();
      });

      es.onerror = () => {
        if (!isMounted) return;
        setIsStreaming(false);
      };
    }

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [projectId, refresh]);

  return {
    status,
    agentStages,
    discoveredCount,
    gapsCount,
    isStreaming,
    error,
    refresh
  };
}
