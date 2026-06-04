import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { apiClient } from './client';
import { useAuthStore } from '@/store/auth.store';

export interface Explanation {
  nodeId: string;
  nodeTitle: string;
  explanation: {
    summary: string;
    keyPoints: string[];
    commonMistakes?: string[];
  } | null;
  weakAreas?: string[] | null;
  fallback?: { description?: string; learningOutcomes: string[] } | null;
}

export function useExplanationQuery(nodeId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['explanation', nodeId],
    queryFn: () =>
      apiClient.get<Explanation>(`/nodes/${nodeId}/explanation`).then((r) => r.data),
    enabled: enabled && Boolean(nodeId),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// ── Streamed sections parsed from the SSE text ───────────────────────────────

export interface StreamedSections {
  summary: string;
  whyItMatters: string;
  keyPoints: string[];
  example: string;
  commonMistakes: string[];
}

export function parseStreamSections(text: string): StreamedSections {
  const summaryM      = text.match(/\[SUMMARY\]([\s\S]*?)(?=\[WHY_IT_MATTERS\]|\[KEY_POINTS\]|\[EXAMPLE\]|\[COMMON_MISTAKES\]|$)/);
  const whyM          = text.match(/\[WHY_IT_MATTERS\]([\s\S]*?)(?=\[KEY_POINTS\]|\[EXAMPLE\]|\[COMMON_MISTAKES\]|$)/);
  const keyPointsM    = text.match(/\[KEY_POINTS\]([\s\S]*?)(?=\[EXAMPLE\]|\[COMMON_MISTAKES\]|$)/);
  const exampleM      = text.match(/\[EXAMPLE\]([\s\S]*?)(?=\[COMMON_MISTAKES\]|$)/);
  const mistakesM     = text.match(/\[COMMON_MISTAKES\]([\s\S]*?)$/);

  const summary = summaryM?.[1]?.trim() ?? '';
  const whyItMatters = whyM?.[1]?.trim() ?? '';
  const keyPoints = (keyPointsM?.[1] ?? '')
    .split('\n')
    .filter((l) => l.trim().startsWith('-'))
    .map((l) => l.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean);
  const example = exampleM?.[1]?.trim() ?? '';
  const commonMistakes = (mistakesM?.[1] ?? '')
    .split('\n')
    .filter((l) => l.trim().startsWith('-'))
    .map((l) => l.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean);

  return { summary, whyItMatters, keyPoints, example, commonMistakes };
}

// ── SSE streaming hook ────────────────────────────────────────────────────────

export interface ExplanationStreamState {
  /** Raw accumulated text from the stream */
  text: string;
  /** Parsed sections — updates incrementally as text grows */
  sections: StreamedSections;
  isStreaming: boolean;
  isDone: boolean;
  isError: boolean;
}

export function useExplanationStream(
  nodeId: string,
  enabled: boolean,
): ExplanationStreamState {
  const accessToken = useAuthStore((s) => s.accessToken);

  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone]     = useState(false);
  const [isError, setIsError]   = useState(false);

  // Use a ref so the abort controller survives re-renders
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || !nodeId) return;

    // Reset state for new fetch
    setText('');
    setIsDone(false);
    setIsError(false);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const res = await fetch(`/api/v1/nodes/${nodeId}/explanation/stream`, {
          headers: { Authorization: `Bearer ${accessToken ?? ''}` },
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setIsError(true);
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE lines are separated by \n\n; split on individual \n
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? ''; // keep incomplete last line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();

            if (payload === '[DONE]') {
              setIsDone(true);
              setIsStreaming(false);
              return;
            }

            try {
              const parsed = JSON.parse(payload) as { t?: string; error?: string };
              if (parsed.error) {
                setIsError(true);
                setIsStreaming(false);
                return;
              }
              if (parsed.t) {
                // flushSync forces React to render this token immediately
                // before processing the next one, bypassing React 18's
                // automatic batching which collapses rapid updates into one render.
                flushSync(() => setText((prev) => prev + parsed.t));
              }
            } catch {
              // Malformed SSE line — skip
            }
          }
        }

        // Stream ended without [DONE] — treat as complete
        setIsDone(true);
        setIsStreaming(false);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setIsError(true);
        setIsStreaming(false);
      }
    })();

    return () => {
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, enabled]);

  // Memoize so callers that include `sections` in useEffect deps don't re-fire every render.
  const sections = useMemo(() => parseStreamSections(text), [text]);
  return { text, sections, isStreaming, isDone, isError };
}
