import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapDbNotificationToNotification } from '@/lib/utils';
import type { Notification } from '@/lib/types';

export function useNotifications(userId: string | null, options?: { limit?: number; unreadOnly?: boolean }) {
  return useQuery({
    queryKey: ['notifications', userId, options],
    enabled: !!userId,
    queryFn: async () => {
      if (!supabase || !userId) return [];
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (options?.unreadOnly) {
        query = query.is('read_at', null);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data.map(mapDbNotificationToNotification) as Notification[];
    },
  });
}

export function useUnreadNotificationCount(userId: string | null) {
  return useQuery({
    queryKey: ['notifications-unread-count', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!supabase || !userId) return 0;
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null)
        .is('deleted_at', null);

      if (error) throw new Error(error.message);
      return count || 0;
    },
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!supabase) throw new Error('Supabase not configured');
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!supabase) throw new Error('Supabase not configured');
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}