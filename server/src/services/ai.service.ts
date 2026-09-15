import { env } from '../config/env.js';
import { httpErrors } from '../errors/httpErrors.js';

export interface AIResearchResult {
  topic: string;
  papersProcessed: number;
  totalChunks: number;
  report: string;
}

interface AIResearchResponse {
  topic: string;
  papers_processed: number;
  total_chunks: number;
  report: string;
}

export async function runResearch(topic: string, paperLimit: number): Promise<AIResearchResult> {
  const response = await fetch(`${env.AI_SERVICE_URL}/research`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ topic, paper_limit: paperLimit }),
    signal: AbortSignal.timeout(env.AI_SERVICE_TIMEOUT_MS)
  });

  if (!response.ok) {
    const errorText = (await response.text()).trim();
    throw httpErrors.badGateway(
      `AI service research request failed (${response.status})${errorText ? `: ${errorText}` : ''}`,
      'AI_SERVICE_REQUEST_FAILED'
    );
  }

  const parsed = (await response.json()) as AIResearchResponse;
  return {
    topic: parsed.topic,
    papersProcessed: parsed.papers_processed,
    totalChunks: parsed.total_chunks,
    report: parsed.report
  };
}
