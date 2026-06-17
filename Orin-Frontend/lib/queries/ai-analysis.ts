import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

/**
 * Hook: AI skill analysis — expensive NIM inference call.
 * Cached for 5 minutes to avoid redundant calls on navigation.
 */
export function useSkillAnalysis(targetRole?: string) {
  return useQuery({
    queryKey: ['skill-analysis', targetRole ?? ''],
    queryFn: () => api.ai.skills(targetRole),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook: AI portfolio score — expensive NIM inference call.
 * Cached for 10 minutes since portfolio changes rarely.
 */
export function usePortfolioScore() {
  return useQuery({
    queryKey: ['portfolio-score'],
    queryFn: () => api.ai.score(),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
