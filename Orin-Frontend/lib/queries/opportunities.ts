import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapDbOpportunityToOpportunity } from '@/lib/utils';
import type { Opportunity } from '@/lib/types';

export function useOpportunities(filters?: {
  type?: string;
  search?: string;
  sortBy?: 'match' | 'recent' | 'salary';
}) {
  return useQuery({
    queryKey: ['opportunities', filters],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured');

      let query = supabase
        .from('opportunities')
        .select('*')
        .eq('is_active', true)
        .is('deleted_at', null);

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`title.ilike.${searchTerm},company.ilike.${searchTerm},required_skills.cs.{${filters.search}}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

      if (error) throw new Error(error.message);
      return data.map(mapDbOpportunityToOpportunity) as Opportunity[];
    },
  });
}

export function useUserOpportunities(userId: string | null) {
  return useQuery({
    queryKey: ['user-opportunities', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!supabase || !userId) return {};
      const { data, error } = await supabase
        .from('user_opportunities')
        .select('opportunity_id, status')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (error) throw new Error(error.message);
      return data.reduce((acc, item) => {
        acc[item.opportunity_id] = item.status;
        return acc;
      }, {} as Record<string, string>);
    },
  });
}

export function useSaveOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ opportunityId, status }: { opportunityId: string; status: string }) => {
      if (!supabase) throw new Error('Supabase not configured');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!userData) throw new Error('User profile not found');

      const { error } = await supabase
        .from('user_opportunities')
        .upsert({
          user_id: userData.id,
          opportunity_id: opportunityId,
          status,
        }, { onConflict: 'user_id,opportunity_id' });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-opportunities'] });
    },
  });
}