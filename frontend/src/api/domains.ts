import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { useMyLearningStore } from '@/store/myLearning.store';
import type { Domain } from '@/types';

export const domainKeys = {
  all: ['domains'] as const,
  bySlug: (slug: string) => ['domains', slug] as const,
};

export function useDomainsQuery() {
  return useQuery({
    queryKey: domainKeys.all,
    queryFn: () =>
      apiClient.get<{ domains: Domain[] }>('/domains').then((r) => r.data.domains),
  });
}

export function useDomainBySlugQuery(slug: string) {
  return useQuery({
    queryKey: domainKeys.bySlug(slug),
    queryFn: () =>
      apiClient.get<{ domain: Domain }>(`/domains/${slug}`).then((r) => r.data.domain),
    enabled: Boolean(slug),
  });
}

export function useDeleteDomainMutation() {
  const qc = useQueryClient();
  const myLearning = useMyLearningStore();

  return useMutation({
    mutationFn: ({ id }: { id: string; slug: string }) =>
      apiClient.delete(`/domains/${id}`),
    onSuccess: (_data, { slug }) => {
      // Remove all My Learning sidebar entries for this domain
      const toRemove = myLearning.entries.filter((e) => e.domainSlug === slug);
      toRemove.forEach((e) => myLearning.remove(e.enrollmentId));

      qc.invalidateQueries({ queryKey: domainKeys.all });
    },
  });
}
