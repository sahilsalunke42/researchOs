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
  | 'ANALYZING'
  | 'REPORTING'
  | 'COMPLETE'
  | 'ERROR';

export type AgentNameDTO = 'DISCOVERY' | 'INGESTION' | 'ANALYSIS' | 'GAPS' | 'REPORT';

export type AgentStatusDTO = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'ERROR' | 'SKIPPED';

export interface AgentRunDTO {
  id: string;
  agentName: AgentNameDTO;
  status: AgentStatusDTO;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
}

export interface PaperDTO {
  id: string;
  projectId: string;
  externalId: string;
  source: 'SEMANTIC_SCHOLAR' | 'ARXIV' | 'OPENALEX';
  title: string;
  authors: string[];
  year: number | null;
  venue: string | null;
  abstractText: string | null;
  pdfUrl: string | null;
  citationCount: number;
  summaryProblem: string | null;
  summaryMethod: string | null;
  summaryDataset: string | null;
  summaryResults: string | null;
  summaryLimits: string | null;
  bookmarked: boolean;
  createdAt: string;
}

export interface GapEvidenceDTO {
  id: string;
  paperTitle: string | null;
  paperDoi: string | null;
  passage: string;
  pageNumber: number | null;
  sectionTitle: string | null;
  relation: 'SUPPORTS' | 'CONTRADICTS' | 'PARTIALLY_SUPPORTS' | 'ADDRESSES_ALREADY' | 'UNCLEAR';
}

export interface GapCandidateDTO {
  id: string;
  projectId: string;
  topicA: string;
  topicB: string;
  statement: string;
  coOccurrenceScore: number;
  alpha: number;
  beta: number;
  validationStatus: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED' | 'INCONCLUSIVE';
  evidence: GapEvidenceDTO[];
  createdAt: string;
}

export interface PaperComparisonDTO {
  id: string;
  projectId: string;
  paperId: string;
  paperTitle?: string;
  question: string | null;
  methodology: string | null;
  dataset: string | null;
  metrics: string | null;
  findings: string | null;
  limitations: string | null;
  futureWork: string | null;
}

export interface ReportDTO {
  id: string;
  projectId: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
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
  papers?: PaperDTO[];
  gapCandidates?: GapCandidateDTO[];
  report?: ReportDTO | null;
}
