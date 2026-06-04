import http from 'http';
import { URL } from 'url';
import config from '../config';
import type { LearnerContext } from '../modules/progress/learner-context.service';

const BASE = config.services.aiServiceUrl;

async function post<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(130_000), // slightly over Ollama's 120 s
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface AiQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface AiQuizResponse {
  quiz: { questions: AiQuestion[]; generatedBy: string } | null;
}

export interface AiExplanationResponse {
  explanation: {
    summary: string;
    keyPoints: string[];
    commonMistakes?: string[];
  } | null;
}

interface NodeContext {
  nodeId: string;
  nodeTitle: string;
  description?: string;
  learningOutcomes: string[];
  difficultyLevel?: number;
  adaptedDifficulty?: number;
  questionCount?: number;
  weakAreas?: string[];
  explanation?: { summary: string; keyPoints: string[]; commonMistakes?: string[] };
  learnerContext?: LearnerContext;
}

export async function requestAiQuiz(ctx: NodeContext): Promise<AiQuizResponse | null> {
  return post<AiQuizResponse>('/api/v1/ai/generate-quiz', ctx);
}

export async function requestAiExplanation(ctx: NodeContext): Promise<AiExplanationResponse | null> {
  return post<AiExplanationResponse>('/api/v1/ai/generate-explanation', ctx);
}

export async function requestAiMicroQuiz(ctx: NodeContext): Promise<AiQuizResponse | null> {
  // Use a short timeout for interactive micro-quiz generation (10 s).
  // The ai-service will skip slow Ollama and prefer Gemini when Ollama exceeds its own timeout.
  try {
    const res = await fetch(`${BASE}/api/v1/ai/generate-micro-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ctx),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as AiQuizResponse;
  } catch {
    return null;
  }
}

export interface AiAskPayload {
  nodeId: string;
  nodeTitle: string;
  question: string;
  description?: string;
  learningOutcomes?: string[];
  explanation?: { summary: string; keyPoints: string[]; commonMistakes?: string[] } | null;
  learnerContext?: LearnerContext;
}

export interface AiAskResponse {
  answer: string | null;
}

export async function requestAiAsk(payload: AiAskPayload): Promise<AiAskResponse | null> {
  return post<AiAskResponse>('/api/v1/ai/ask-question', payload);
}

/**
 * Pipe an ai-service SSE stream into an Express response using Node.js http.request.
 * Node.js fetch (undici) buffers chunked responses from uvicorn before delivering them,
 * causing the stream to appear frozen. The built-in http module streams chunks immediately.
 */
function pipeAiStream(
  path: string,
  body: unknown,
  res: import('express').Response,
): Promise<void> {
  return new Promise((resolve) => {
    const parsed = new URL(BASE);
    const options: http.RequestOptions = {
      hostname: parsed.hostname,
      port: Number(parsed.port) || 80,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (upstream) => {
      if ((upstream.statusCode ?? 0) >= 400) {
        if (!res.writableEnded) {
          res.write('data: {"error":"upstream failed"}\n\n');
          res.end();
        }
        resolve();
        return;
      }

      upstream.on('data', (chunk: Buffer) => {
        if (!res.writableEnded) res.write(chunk);
      });
      upstream.on('end', () => {
        if (!res.writableEnded) res.end();
        resolve();
      });
      upstream.on('error', () => {
        if (!res.writableEnded) res.end();
        resolve();
      });
    });

    req.setTimeout(120_000, () => req.destroy());
    req.on('error', () => {
      if (!res.writableEnded) {
        res.write('data: {"error":"ai-service unreachable"}\n\n');
        res.end();
      }
      resolve();
    });

    // Abort the upstream request when the client disconnects
    res.on('close', () => req.destroy());

    req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Call the ai-service streaming explanation endpoint and pipe the SSE response
 * directly into the Express response.  Handles client disconnect gracefully.
 */
export function streamAiExplanation(
  ctx: NodeContext,
  res: import('express').Response,
): Promise<void> {
  return pipeAiStream('/api/v1/ai/generate-explanation/stream', ctx, res);
}

/**
 * Call the ai-service streaming ask-question endpoint and pipe the SSE response
 * directly into the Express response. Handles client disconnect gracefully.
 */
export function streamAiAsk(
  payload: AiAskPayload,
  res: import('express').Response,
): Promise<void> {
  return pipeAiStream('/api/v1/ai/ask-question/stream', payload, res);
}

export async function invalidateRemedialQuizCache(nodeId: string): Promise<void> {
  try {
    await fetch(`${BASE}/api/v1/ai/cache/remedial/${nodeId}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Cache invalidation is best-effort
  }
}
