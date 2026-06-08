import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type DbIntegration = Database['public']['Tables']['user_integrations']['Row'];

export interface UserIntegration {
  id: string;
  provider: string;
  externalUsername: string | null;
  status: 'connected' | 'disconnected' | 'pending' | 'error';
  lastSyncedAt: Date | null;
  createdAt: Date;
}

function mapDbIntegration(db: DbIntegration): UserIntegration {
  return {
    id: db.id,
    provider: db.provider,
    externalUsername: db.external_username,
    status: db.status,
    lastSyncedAt: db.last_synced_at ? new Date(db.last_synced_at) : null,
    createdAt: new Date(db.created_at),
  };
}

export function useUserIntegrations(userId: string | null) {
  return useQuery({
    queryKey: ['user-integrations', userId],
    enabled: !!userId,
    queryFn: async (): Promise<UserIntegration[]> => {
      if (!supabase || !userId) return [];
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data.map(mapDbIntegration);
    },
  });
}

export function useConnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      provider,
      externalUserId,
      externalUsername,
    }: {
      provider: string;
      externalUserId?: string;
      externalUsername?: string;
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
        .from('user_integrations')
        .upsert({
          user_id: userData.id,
          provider: provider as DbIntegration['provider'],
          external_user_id: externalUserId || null,
          external_username: externalUsername || null,
          status: 'connected',
          last_synced_at: new Date().toISOString(),
        }, { onConflict: 'user_id,provider' })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapDbIntegration(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-integrations'] });
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (integrationId: string) => {
      if (!supabase) throw new Error('Supabase not configured');
      const { error } = await supabase
        .from('user_integrations')
        .update({ status: 'disconnected', deleted_at: new Date().toISOString() })
        .eq('id', integrationId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-integrations'] });
    },
  });
}
