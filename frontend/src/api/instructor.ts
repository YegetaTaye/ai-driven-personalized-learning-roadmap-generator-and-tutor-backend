import { useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from './client';

// ── Response shapes ───────────────────────────────────────────────────────────

export interface InstructorEnrollment {
  id: string;
  enrolledAt: string;
  selectedBranchPath: string | null;
  user: { id: string; email: string; fullName: string; avatarUrl: string | null };
  domain: { id: string; name: string; slug: string };
  _count: { nodeProgress: number };
}

export interface LearnerProgressEnrollment {
  id: string;
  domain: { id: string; name: string; slug: string };
  nodeProgress: {
    masteryState: string;
    bestQuizScore: string | null;
    attemptsCount: number;
    updatedAt: string;
    node: { id: string; title: string; slug: string; difficultyLevel: number | null };
  }[];
}

export interface QuizAttempt {
  id: string;
  scorePercent: string;
  outcome: string;
  completedAt: string;
  startedAt: string;
  node: { id: string; title: string; slug: string };
  quiz: { id: string; isMicroQuiz: boolean; generatedBy: string };
}

export interface NodeAnalytic {
  nodeId: string;
  title: string;
  slug: string;
  difficultyLevel: number | null;
  learnerCount: number;
  masteryRate: number;
  avgQuizScore: number | null;
  avgAttempts: number;
}

export interface FlaggedEvent {
  id: string;
  userId: string;
  nodeId: string;
  adaptationType: string;
  details: {
    reason?: string;
    failCount?: number;
    resolved?: boolean;
    resolutionNotes?: string;
    resolvedAt?: string;
  };
  createdAt: string;
  user: { id: string; fullName: string; email: string };
  node: { id: string; title: string; slug: string };
  quizAttempt: { id: string; scorePercent: string; outcome: string } | null;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const instructorKeys = {
  learners:        (domainId?: string) => ['instructor', 'learners', domainId ?? 'all'] as const,
  learnerProgress: (userId: string)   => ['instructor', 'progress', userId] as const,
  quizHistory:     (userId: string)   => ['instructor', 'quiz-history', userId] as const,
  analytics:       (domainId: string) => ['instructor', 'analytics', domainId] as const,
  flagged:         ()                 => ['instructor', 'flagged'] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useLearnersQuery(domainId?: string) {
  return useQuery({
    queryKey: instructorKeys.learners(domainId),
    queryFn: () =>
      apiClient
        .get<{ learners: InstructorEnrollment[]; total: number }>('/instructor/learners', {
          params: domainId ? { domainId } : {},
        })
        .then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useLearnerProgressQuery(userId: string) {
  return useQuery({
    queryKey: instructorKeys.learnerProgress(userId),
    queryFn: () =>
      apiClient
        .get<{ user: { id: string; email: string; fullName: string }; enrollments: LearnerProgressEnrollment[] }>(
          `/instructor/learners/${userId}/progress`,
        )
        .then((r) => r.data),
    enabled: Boolean(userId),
  });
}

export function useLearnerQuizHistoryQuery(userId: string) {
  return useQuery({
    queryKey: instructorKeys.quizHistory(userId),
    queryFn: () =>
      apiClient
        .get<{ user: { fullName: string; email?: string }; attempts: QuizAttempt[]; total: number }>(
          `/instructor/learners/${userId}/quiz-history`,
          { params: { limit: 50 } },
        )
        .then((r) => r.data),
    enabled: Boolean(userId),
  });
}

export function useDomainAnalyticsQuery(domainId: string) {
  return useQuery({
    queryKey: instructorKeys.analytics(domainId),
    queryFn: () =>
      apiClient
        .get<{
          domain: { id: string; name: string };
          enrollmentCount?: number;
          overallMasteryRate?: number;
          nodeAnalytics?: NodeAnalytic[];
          problemNodes?: NodeAnalytic[];
          // Backward-compatible shape returned when no ontology exists
          nodes?: NodeAnalytic[];
        }>(`/instructor/domains/${domainId}/analytics`)
        .then((r) => {
          const raw = r.data;
          const nodeAnalytics = raw.nodeAnalytics ?? raw.nodes ?? [];
          const problemNodes =
            raw.problemNodes ??
            [...nodeAnalytics]
              .filter((n) => (n.learnerCount ?? 0) > 0)
              .sort((a, b) => (a.masteryRate ?? 0) - (b.masteryRate ?? 0))
              .slice(0, 5);

          const overallMasteryRate =
            typeof raw.overallMasteryRate === 'number'
              ? raw.overallMasteryRate
              : nodeAnalytics.length > 0
                ? nodeAnalytics.reduce((sum, n) => sum + (n.masteryRate ?? 0), 0) / nodeAnalytics.length
                : 0;

          return {
            domain: raw.domain,
            enrollmentCount: raw.enrollmentCount ?? 0,
            overallMasteryRate,
            nodeAnalytics,
            problemNodes,
          };
        }),
    enabled: Boolean(domainId),
  });
}

export function useFlaggedEventsQuery() {
  return useQuery({
    queryKey: instructorKeys.flagged(),
    queryFn: () =>
      apiClient
        .get<{ flaggedEvents: FlaggedEvent[]; total: number }>('/instructor/flagged', {
          params: { limit: 100 },
        })
        .then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useResolveEventMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, resolutionNotes }: { eventId: string; resolutionNotes: string }) =>
      apiClient
        .patch(`/instructor/flagged/${eventId}/resolve`, { resolutionNotes })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: instructorKeys.flagged() }),
  });
}

// ── Analytics AI stream ───────────────────────────────────────────────────────

export type AiStreamState = 'idle' | 'streaming' | 'done' | 'error';

const CACHE_KEY = (domainId: string) => `Yeneta-ai-analysis:${domainId}`;

function readCache(domainId: string): string | null {
  try { return localStorage.getItem(CACHE_KEY(domainId)); } catch { return null; }
}
function writeCache(domainId: string, text: string) {
  try { localStorage.setItem(CACHE_KEY(domainId), text); } catch { /* storage full */ }
}
function clearCache(domainId: string) {
  try { localStorage.removeItem(CACHE_KEY(domainId)); } catch { /* noop */ }
}

export function useAnalyticsAiStream(domainId: string) {
  const cached = domainId ? readCache(domainId) : null;
  const [state, setState] = useState<AiStreamState>(cached ? 'done' : 'idle');
  const [text, setText] = useState(cached ?? '');
  const abortRef = useRef<AbortController | null>(null);
  // Restore from cache when domainId changes
  const prevDomainRef = useRef(domainId);
  if (prevDomainRef.current !== domainId) {
    prevDomainRef.current = domainId;
    const c = readCache(domainId);
    setState(c ? 'done' : 'idle');
    setText(c ?? '');
  }

  const stream = useCallback((isRegenerate = false) => {
    if (!domainId) return;
    // If we have cached text and this isn't an explicit regenerate, skip
    if (!isRegenerate && readCache(domainId)) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState('streaming');
    setText('');

    void (async () => {
      try {
        const token = useAuthStore.getState().accessToken;
        const res = await fetch(`/api/v1/instructor/domains/${domainId}/analytics/ai-stream`, {
          headers: { Authorization: `Bearer ${token ?? ''}` },
          signal: controller.signal,
        });
        if (!res.ok || !res.body) { setState('error'); return; }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let full = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') {
              if (full) writeCache(domainId, full);
              setState('done');
              return;
            }
            try {
              const p = JSON.parse(raw);
              if (p.error) { setState('error'); return; }
              if (p.t) {
                full += p.t;
                flushSync(() => setText((prev) => prev + p.t));
              }
            } catch { /* skip malformed */ }
          }
        }
        if (full) writeCache(domainId, full);
        setState('done');
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setState('error');
      }
    })();
  }, [domainId]);

  // generate — uses cache if available
  const generate = useCallback(() => stream(false), [stream]);
  // regenerate — clears cache and streams fresh
  const regenerate = useCallback(() => {
    clearCache(domainId);
    stream(true);
  }, [domainId, stream]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    clearCache(domainId);
    setState('idle');
    setText('');
  }, [domainId]);

  return { state, text, generate, regenerate, reset };
}
