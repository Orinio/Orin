import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapDbUserToUser, mapDbCoachNoteToCoachNote, mapDbOpportunityToOpportunity } from '@/lib/utils';
import type { User, CoachNote, Opportunity } from '@/lib/types';

/**
 * Resolve a Supabase Auth UUID to the internal database user row.
 * This is the critical bridge: auth.users.id ≠ users.id
 * auth.users.id is stored in users.auth_user_id
 */
async function resolveDbUser(authUserId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/**
 * Hook: Get the current user's database row from their Auth UUID.
 * Returns the full User object with all profile fields.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      if (!supabase) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const dbUser = await resolveDbUser(user.id);
      if (!dbUser) return null;
      return mapDbUserToUser(dbUser) as User;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook: Get a user by their internal database ID.
 */
export function useUser(dbUserId: string | null) {
  return useQuery({
    queryKey: ['user', dbUserId],
    enabled: !!dbUserId,
    queryFn: async () => {
      if (!supabase || !dbUserId) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', dbUserId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return mapDbUserToUser(data) as User;
    },
  });
}

/**
 * Hook: Get the current user's database ID (the users.id UUID).
 * This is the ID needed for all child table queries (proof_cards.user_id, etc.)
 */
export function useCurrentDbUserId() {
  return useQuery({
    queryKey: ['current-db-user-id'],
    queryFn: async () => {
      if (!supabase) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const dbUser = await resolveDbUser(user.id);
      return dbUser?.id ?? null;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!supabase) throw new Error('Supabase not configured');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('users')
        .update({
          full_name: updates.fullName,
          headline: updates.headline,
          location: updates.location,
          username: updates.username,
          bio: updates.bio,
          website_url: updates.websiteUrl,
          github_url: updates.githubUrl,
          linkedin_url: updates.linkedinUrl,
          twitter_url: updates.twitterUrl,
          is_profile_public: updates.isProfilePublic,
          hide_email: updates.hideEmail,
        })
        .eq('auth_user_id', user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export interface DashboardStats {
  proofsCount: number;
  verifiedCount: number;
  totalViews: number;
  uniqueSkills: number;
  topSkills: { name: string; count: number }[];
  sourceTypeCounts: Record<string, number>;
  opportunitiesCount: number;
  latestCoachNote: CoachNote | null;
  recentOpportunities: Opportunity[];
}

/**
 * Hook: Fetch all dashboard stats in a single optimized query.
 * Accepts a DB user ID (users.id), NOT the auth UUID.
 */
export function useDashboardStats(dbUserId: string | null) {
  return useQuery({
    queryKey: ['dashboard-stats', dbUserId],
    enabled: !!dbUserId,
    queryFn: async (): Promise<DashboardStats | null> => {
      if (!supabase || !dbUserId) return null;

      const [proofsResult, opportunitiesResult, notesResult] = await Promise.all([
        supabase
          .from('proof_cards')
          .select('id, verification_status, view_count, skills_extracted, skills_user_added, source_type')
          .eq('user_id', dbUserId)
          .is('deleted_at', null),
        supabase
          .from('opportunities')
          .select('*')
          .eq('is_active', true)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('coach_notes')
          .select('*')
          .eq('user_id', dbUserId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const proofs = proofsResult.data || [];
      const opportunities = opportunitiesResult.data || [];
      const latestNote = notesResult.data;

      const totalViews = proofs.reduce((sum, p) => sum + (p.view_count || 0), 0);
      const verifiedCount = proofs.filter((p) => p.verification_status === 'verified').length;
      const allSkills = Array.from(
        new Set(proofs.flatMap((p) => [...(p.skills_extracted || []), ...(p.skills_user_added || [])]))
      );
      const skillCounts = allSkills
        .map((skill) => ({
          name: skill,
          count: proofs.filter((p) =>
            (p.skills_extracted || []).includes(skill) || (p.skills_user_added || []).includes(skill)
          ).length,
        }))
        .sort((a, b) => b.count - a.count);

      const sourceTypeCounts = proofs.reduce((acc, p) => {
        acc[p.source_type] = (acc[p.source_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        proofsCount: proofs.length,
        verifiedCount,
        totalViews,
        uniqueSkills: allSkills.length,
        topSkills: skillCounts.slice(0, 5),
        sourceTypeCounts,
        opportunitiesCount: opportunities.length,
        latestCoachNote: latestNote ? mapDbCoachNoteToCoachNote(latestNote) : null,
        recentOpportunities: opportunities.map(mapDbOpportunityToOpportunity),
      };
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: Get proof count for a user (for usage limits).
 * Accepts the auth UUID and resolves internally.
 */
export function useProofCount() {
  return useQuery({
    queryKey: ['proof-count'],
    queryFn: async () => {
      if (!supabase) return 0;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const dbUser = await resolveDbUser(user.id);
      if (!dbUser) return 0;
      const { count } = await supabase
        .from('proof_cards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', dbUser.id)
        .is('deleted_at', null);
      return count ?? 0;
    },
    staleTime: 10 * 1000,
  });
}
