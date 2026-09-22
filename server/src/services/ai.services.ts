import { env } from '../config/env.js';
import { httpErrors } from '../errors/httpErrors.js';
import type { ResearchResponseDTO } from '../types/api.types.js';

async function callAI<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${env.AI_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw httpErrors.badGateway(`AI service is unavailable: ${reason}`, 'AI_SERVICE_UNAVAILABLE');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw httpErrors.badGateway(`AI service error (${response.status}): ${errorText}`, 'AI_SERVICE_ERROR');
  }

  return response.json() as Promise<T>;
}

export const aiService = {
  async runResearch(topic: string, paperLimit: number): Promise<ResearchResponseDTO> {
    return callAI<ResearchResponseDTO>('/research', {
      topic,
      paper_limit: paperLimit
    });
  },

  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${env.AI_SERVICE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
};
