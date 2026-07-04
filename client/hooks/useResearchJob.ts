import type { AgentRunDTO, ProjectStatusDTO } from '@/types/api.types';

export function useResearchJob(_projectId: string): {
  status: ProjectStatusDTO;
  agentStages: AgentRunDTO[];
} {
  return { status: 'QUEUED', agentStages: [] };
}
