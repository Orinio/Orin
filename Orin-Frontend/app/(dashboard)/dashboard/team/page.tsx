'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Shield,
  BarChart3,
  Plus,
  Search,
  Mail,
  Crown,
  Check,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface TeamMember {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: string;
  joined_at: string;
}

interface TeamStats {
  totalMembers: number;
  totalProofs: number;
  verifiedProofs: number;
  avgProofsPerMember: number;
}

export default function TeamPage() {
  const { user: authUser } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!supabase || !authUser) return;

      try {
        // Check user plan
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authUser.id)
          .single();

        if (profile) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', profile.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          setUserPlan(sub?.plan || 'free');

          // Fetch team members (placeholder - would need team_members table)
          // For now, show mock data
          setMembers([]);
          setStats({
            totalMembers: 1,
            totalProofs: 0,
            verifiedProofs: 0,
            avgProofsPerMember: 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch team data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [authUser]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    
    // Simulate invite sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setInviteEmail('');
    setInviting(false);
    alert('Invitation sent! (Demo mode)');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-bloom)' }} />
      </div>
    );
  }

  if (userPlan !== 'team') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1
            className="text-2xl font-semibold flex items-center gap-3"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
          >
            <Users className="h-6 w-6" style={{ color: 'var(--color-bloom)' }} />
            Team Features
          </h1>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-8 text-center"
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--color-bloom)15' }}
          >
            <Crown className="h-8 w-8" style={{ color: 'var(--color-bloom)' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
            Upgrade to Team
          </h2>
          <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
            Team features let you collaborate with colleagues, track team progress, and manage bulk verifications.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-left max-w-sm mx-auto">
            {[
              'Team dashboard with analytics',
              'Invite unlimited members',
              'Bulk proof verification',
              'Custom branding',
              'Priority support',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0" style={{ color: 'var(--color-bloom)' }} />
                <span style={{ color: 'var(--color-ink)' }}>{feature}</span>
              </li>
            ))}
          </ul>
          <a
            href="/dashboard/billing"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--color-bloom)' }}
          >
            Upgrade to Team
            <ExternalLink className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold flex items-center gap-3"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
          >
            <Users className="h-6 w-6" style={{ color: 'var(--color-bloom)' }} />
            Team Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Manage your team and track collective progress.
          </p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Team Members', value: stats?.totalMembers || 0, icon: Users, color: 'var(--color-bloom)' },
          { label: 'Total Proofs', value: stats?.totalProofs || 0, icon: Shield, color: 'var(--color-ember)' },
          { label: 'Verified', value: stats?.verifiedProofs || 0, icon: Check, color: 'var(--color-pulse)' },
          { label: 'Avg per Member', value: stats?.avgProofsPerMember || 0, icon: BarChart3, color: 'var(--color-spark)' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card-premium p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                  {stat.label}
                </span>
                <Icon className="h-4 w-4" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Invite Section */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
          Invite Team Members
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Send an invitation to join your team.
        </p>
        <div className="mt-4 flex gap-3">
          <div className="relative flex-1">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: 'var(--color-text-tertiary)' }}
            />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              placeholder="Enter email address..."
              className="w-full rounded-xl border bg-white pl-10 pr-4 py-3 text-sm transition placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>
          <button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail.trim()}
            className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-bloom)' }}
          >
            {inviting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Send Invite'
            )}
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="card-premium">
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
            Team Members ({members.length})
          </h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {members.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--color-text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                No team members yet. Send an invite to get started!
              </p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: 'var(--color-bloom)' }}
                  >
                    {(member.full_name || member.email)?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                      {member.full_name || member.username}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {member.email}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full" style={{
                  backgroundColor: 'var(--color-bloom)12',
                  color: 'var(--color-bloom)',
                }}>
                  {member.role}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
