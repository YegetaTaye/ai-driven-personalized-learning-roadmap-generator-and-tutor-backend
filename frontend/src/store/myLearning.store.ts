import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MyLearningEntry {
  enrollmentId: string;
  domainName: string;
  domainSlug: string;
  lastNodeId: string;
  lastAccessedAt: string;
}

interface MyLearningState {
  entries: MyLearningEntry[];
  visitedExplanationNodeIds: string[];
  add: (entry: Omit<MyLearningEntry, 'lastAccessedAt'>) => void;
  updateLastNode: (enrollmentId: string, nodeId: string) => void;
  remove: (enrollmentId: string) => void;
  markExplanationVisited: (nodeId: string) => void;
  clear: () => void;
}

export const useMyLearningStore = create<MyLearningState>()(
  persist(
    (set) => ({
      entries: [],
      visitedExplanationNodeIds: [],

      add: (entry) =>
        set((state) => {
          // Update existing entry for the same enrollment
          const existsByEnrollment = state.entries.find((e) => e.enrollmentId === entry.enrollmentId);
          if (existsByEnrollment) {
            return {
              entries: state.entries.map((e) =>
                e.enrollmentId === entry.enrollmentId
                  ? { ...e, lastNodeId: entry.lastNodeId, lastAccessedAt: new Date().toISOString() }
                  : e,
              ),
            };
          }
          // Same domain under a different enrollment — replace, don't duplicate
          const existsByDomain = state.entries.find((e) => e.domainSlug === entry.domainSlug);
          if (existsByDomain) {
            return {
              entries: state.entries.map((e) =>
                e.domainSlug === entry.domainSlug
                  ? { ...entry, lastAccessedAt: new Date().toISOString() }
                  : e,
              ),
            };
          }
          return {
            entries: [
              { ...entry, lastAccessedAt: new Date().toISOString() },
              ...state.entries,
            ],
          };
        }),

      updateLastNode: (enrollmentId, nodeId) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.enrollmentId === enrollmentId
              ? { ...e, lastNodeId: nodeId, lastAccessedAt: new Date().toISOString() }
              : e,
          ),
        })),

      remove: (enrollmentId) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.enrollmentId !== enrollmentId),
        })),

      markExplanationVisited: (nodeId) =>
        set((state) => ({
          visitedExplanationNodeIds: state.visitedExplanationNodeIds.includes(nodeId)
            ? state.visitedExplanationNodeIds
            : [...state.visitedExplanationNodeIds, nodeId],
        })),

      clear: () => set({ entries: [], visitedExplanationNodeIds: [] }),
    }),
    { name: 'Yeneta-my-learning' },
  ),
);
