import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapDbProofToProof } from '@/lib/utils';
import type { Proof } from '@/lib/types';

export function useProofs(userId: string | null) {
  return useQuery({
    queryKey: ['proofs', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!supabase || !userId) return [];
      const { data, error } = await supabase
        .from('proof_cards')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data.map(mapDbProofToProof) as Proof[];
    },
  });
}

export function useProof(proofId: string) {
  return useQuery({
    queryKey: ['proof', proofId],
    enabled: !!proofId,
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not configured');
      const { data, error } = await supabase
        .from('proof_cards')
        .select('*')
        .eq('id', proofId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return null;
      return mapDbProofToProof(data) as Proof;
    },
  });
}

export function useCreateProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proof: {
      title: string;
      source_type: string;
      source_url?: string;
      description?: string;
      skills_extracted?: string[];
    }) => {
      if (!supabase) throw new Error('Supabase not configured');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!userData) throw new Error('User profile not found');

      const { data, error } = await supabase
        .from('proof_cards')
        .insert({
          user_id: userData.id,
          title: proof.title,
          source_type: proof.source_type,
          source_url: proof.source_url || null,
          description: proof.description || null,
          skills_extracted: proof.skills_extracted || [],
          verification_status: 'pending',
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proofs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proofId: string) => {
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
        .from('proof_cards')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', proofId)
        .eq('user_id', userData.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proofs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}