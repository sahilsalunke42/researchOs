import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AgentRunDTO, ProjectStatusDTO } from '@/types/api.types';

export function useResearchJob(projectId: string): {
  status: ProjectStatusDTO;
  agentStages: AgentRunDTO[];
  reportContent: string | null;
} {
  const [status, setStatus] = useState<ProjectStatusDTO>('QUEUED');
  const [agentStages, setAgentStages] = useState<AgentRunDTO[]>([]);
  const [reportContent, setReportContent] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const refresh = async () => {
      try {
        const { project } = await api.get<{
          project: { status: ProjectStatusDTO; agentRuns: AgentRunDTO[]; reportContent?: string | null };
        }>(`/api/projects/${projectId}`);
        if (cancelled) return;
        setStatus(project.status);
        setAgentStages(project.agentRuns);
        setReportContent(project.reportContent ?? null);
        if (!['COMPLETE', 'ERROR'].includes(project.status)) {
          timeoutId = setTimeout(refresh, 2500);
        }
      } catch {
        if (!cancelled) timeoutId = setTimeout(refresh, 2500);
      }
    };

    void refresh();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [projectId]);

  return { status, agentStages, reportContent };
}
