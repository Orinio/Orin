import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapDbCoachNoteToCoachNote } from '@/lib/utils';
import type { CoachNote } from '@/lib/types';

export function useCoachNotes(userId: string | null, options?: { limit?: number; type?: string }) {
  return useQuery({
    queryKey: ['coach-notes', userId, options],
    enabled: !!userId,
    queryFn: async () => {
      if (!supabase || !userId) return [];
      let query = supabase
        .from('coach_notes')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data.map(mapDbCoachNoteToCoachNote) as CoachNote[];
    },
  });
}

export function useLatestCoachNote(userId: string | null) {
  return useCoachNotes(userId, { limit: 1 });
}

export function useGenerateCoachNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteType,
      userQuery,
    }: {
      noteType: 'daily' | 'weekly' | 'milestone' | 'ad_hoc';
      userQuery?: string;
    }) => {
      const response = await fetch('/api/coach-notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteType, userQuery }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate coach note');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-notes'] });
    },
  });
}

export function useDismissCoachNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      if (!supabase) throw new Error('Supabase not configured');
      const { error } = await supabase
        .from('coach_notes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', noteId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-notes'] });
    },
  });
}