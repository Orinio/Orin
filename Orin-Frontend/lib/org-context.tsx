'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Organization, OrgMember, OrgRole, OrgWithMembers } from '@/lib/types';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface OrgContextValue {
  organizations: Organization[];
  currentOrg: OrgWithMembers | null;
  currentOrgId: string | null;
  myRole: OrgRole | null;
  loading: boolean;
  switchOrg: (orgId: string | 'personal') => Promise<void>;
  refreshOrgs: () => Promise<void>;
  refreshCurrentOrg: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<OrgWithMembers | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<OrgRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshOrgs = useCallback(async () => {
    try {
      const { data: session } = await supabase!.auth.getSession();
      if (!session?.session?.access_token) return;

      const resp = await fetch(`${apiBase}/organizations`, {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (resp.ok) {
        const { data } = await resp.json();
        setOrganizations(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    }
  }, []);

  const refreshCurrentOrg = useCallback(async () => {
    if (!currentOrgId) {
      setCurrentOrg(null);
      setMyRole(null);
      return;
    }

    try {
      const { data: session } = await supabase!.auth.getSession();
      if (!session?.session?.access_token) return;

      const resp = await fetch(`${apiBase}/organizations/${currentOrgId}`, {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (resp.ok) {
        const { data } = await resp.json();
        setCurrentOrg(data);
        setMyRole(data.myRole);
      }
    } catch (err) {
      console.error('Failed to fetch current org:', err);
    }
  }, [currentOrgId]);

  const switchOrg = useCallback(async (orgId: string | 'personal') => {
    try {
      const { data: session } = await supabase!.auth.getSession();
      if (!session?.session?.access_token) return;

      const targetId = orgId === 'personal' ? 'personal' : orgId;

      const resp = await fetch(`${apiBase}/organizations/switch/${targetId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (resp.ok) {
        const { data } = await resp.json();
        setCurrentOrgId(data.currentOrgId);
        setMyRole(data.role || null);
      }
    } catch (err) {
      console.error('Failed to switch org:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      setLoading(true);
      await refreshOrgs();

      // Get current org from user profile
      const { data: { user } } = await supabase!.auth.getUser();
      if (user?.user_metadata?.current_org_id) {
        setCurrentOrgId(user.user_metadata.current_org_id);
      }

      setLoading(false);
    }
    init();
  }, [refreshOrgs]);

  // Refresh current org when orgId changes
  useEffect(() => {
    if (currentOrgId) {
      refreshCurrentOrg();
    } else {
      setCurrentOrg(null);
      setMyRole(null);
    }
  }, [currentOrgId, refreshCurrentOrg]);

  return (
    <OrgContext.Provider
      value={{
        organizations,
        currentOrg,
        currentOrgId,
        myRole,
        loading,
        switchOrg,
        refreshOrgs,
        refreshCurrentOrg,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}
