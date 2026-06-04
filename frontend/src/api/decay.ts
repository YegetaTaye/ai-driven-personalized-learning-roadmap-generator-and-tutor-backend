import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { MasteryState, QuizQuestion } from '@/types';

export interface DecayStatus {
  nodeId: string;
  title: string;
  slug: string;
  masteryState: MasteryState;
  daysSinceReview: number | null;
  decayThresholdDays: number;
  daysUntilDecay: number | null;
}

export interface MicroQuiz {
  id: string;
  nodeId: string;
  isMicroQuiz: boolean;
  questions: QuizQuestion[];
}

export interface MicroAttemptPayload {
  enrollmentId: string;
  answers: { questionId: string; answer: string }[];
  startedAt: string;
}

export interface MicroAttemptResult {
  passed: boolean;
  scorePercent: number;
  tier: string;
  newMasteryState: string;
  attemptId: string;
}

export function useDecayStatusQuery(enrollmentId: string) {
  return useQuery({
    queryKey: ['decay-status', enrollmentId],
    queryFn: () =>
      apiClient
        .get<{ decayStatus: DecayStatus[] }>(`/enrollments/${enrollmentId}/decay-status`)
        .then((r) => r.data.decayStatus),
    enabled: Boolean(enrollmentId),
    staleTime: 60_000,
  });
}

export function useMicroQuizMutation() {
  return useMutation({
    mutationFn: (nodeId: string) =>
      apiClient
        .post<{ quiz: MicroQuiz }>(`/nodes/${nodeId}/micro-quiz`)
        .then((r) => r.data.quiz),
  });
}

export function useSubmitMicroAttemptMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, payload }: { quizId: string; payload: MicroAttemptPayload; nodeId: string }) =>
      apiClient
        .post<MicroAttemptResult>(`/micro-quizzes/${quizId}/attempt`, payload)
        .then((r) => r.data),
    onSuccess: (result, { nodeId }) => {
      if (result.passed) {
        // Remove the passed node from ALL decay-status caches immediately (optimistic update)
        qc.setQueriesData<DecayStatus[]>({ queryKey: ['decay-status'] }, (prev) =>
          prev ? prev.filter((d) => d.nodeId !== nodeId) : prev,
        );
      }
      // Refetch everything to sync server state
      qc.invalidateQueries({ queryKey: ['roadmap'] });
      qc.invalidateQueries({ queryKey: ['decay-status'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['progress-stats'] });
    },
  });
}
