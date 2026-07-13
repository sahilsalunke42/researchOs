import { create } from 'zustand';
import type { ProjectDTO, ProjectStatusDTO, AgentRunDTO } from '@/types/api.types';

interface ResearchState {
  currentProject: ProjectDTO | null;
  agentStages: AgentRunDTO[];
  status: ProjectStatusDTO;
  setProject(p: ProjectDTO | null): void;
}

export const useResearchStore = create<ResearchState>((set) => ({
  currentProject: null,
  agentStages: [],
  status: 'QUEUED',
  setProject: (p) => set({
    currentProject: p,
    agentStages: p?.agentRuns ?? [],
    status: p?.status ?? 'QUEUED'
  })
}));
