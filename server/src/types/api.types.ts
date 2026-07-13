export interface UserDTO {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export type ProjectStatusDTO =
  | 'QUEUED'
  | 'DISCOVERING'
  | 'INGESTING'
  | 'REPORTING'
  | 'COMPLETE'
  | 'ERROR';

export interface AgentRunDTO {
  id: string;
  agentName: 'DISCOVERY' | 'INGESTION' | 'REPORT';
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'ERROR' | 'SKIPPED';
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
}

export interface ProjectDTO {
  id: string;
  name: string;
  topic: string;
  paperLimit: number;
  status: ProjectStatusDTO;
  createdAt: string;
  updatedAt: string;
  agentRuns: AgentRunDTO[];
}
