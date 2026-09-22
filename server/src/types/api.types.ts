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

export interface ResearchEvidenceDTO {
  claim: string;
  evidence: string;
  paper: string;
  page: number | null;
  source_url: string | null;
  evidence_type: string;
}

export interface ResearchResponseDTO {
  topic: string;
  papers_processed: number;
  total_chunks: number;
  report: string;
  paper_analysis: Array<{
    paper: string;
    objective: string;
    method: string;
    dataset: string;
    findings: string;
    limitations: string;
  }>;
  research_gaps: Array<{
    gap: string;
    description: string;
    evidence: string[];
    source_papers: string[];
    confidence: number | null;
  }>;
  contradictions: Array<{
    claim_a: string;
    claim_b: string;
    paper_a: string;
    paper_b: string;
    evidence_a: string;
    evidence_b: string;
    possible_reason: string | null;
    confidence: number | null;
    status: string;
  }>;
  supporting_evidence: ResearchEvidenceDTO[];
  contrasting_evidence: ResearchEvidenceDTO[];
  sources: Array<Record<string, unknown>>;
}
