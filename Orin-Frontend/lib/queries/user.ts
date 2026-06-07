import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapDbUserToUser, mapDbCoachNoteToCoachNote } from '@/lib/utils';
import type { User } from '@/lib/types';

export function useUser(userId: string | null) {
  return useQuery({
    queryKey: ['user', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!supabase || !userId) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return null;
      return mapDbUserToUser(data) as User;
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      if (!supabase) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!userData) return null;
      return mapDbUserToUser(userData) as User;
    },
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

export function useDashboardStats(userId: string | null) {
  return useQuery({
    queryKey: ['dashboard-stats', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!supabase || !userId) return null;

      const [proofsResult, opportunitiesResult, notesResult] = await Promise.all([
        supabase
          .from('proof_cards')
          .select('id, verification_status, view_count, skills_extracted, skills_user_added, source_type')
          .eq('user_id', userId)
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
          .eq('user_id', userId)
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
      };
    },
  });
}