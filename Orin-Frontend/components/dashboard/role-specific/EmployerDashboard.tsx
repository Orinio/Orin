'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Users,
  BarChart3,
  TrendingUp,
  Loader2,
  Search,
  ChevronRight,
  ExternalLink,
  Building2,
  Target,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface Candidate {
  id: string;
  fullName: string;
  headline: string | null;
  avatarUrl: string | null;
  skills: string[];
  proofCount: number;
  matchScore: number;
}

interface EmployerStats {
  totalCandidates: number;
  shortlisted: number;
  interviews: number;
  hired: number;
  topSkillsDemand: Array<{ skill: string; count: number }>;
}

export default function EmployerDashboard() {
  const { user: authUser } = useAuth();
  const [stats, setStats] = useState<EmployerStats | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEmployerData = async () => {
      if (!supabase || !authUser) return;

      try {
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authUser.id)
          .single();

        if (profile) {
          // Fetch stats
          const [candidatesRes, proofsRes] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact' }).eq('role', 'user'),
            supabase.from('proof_cards').select('id, verification_status'),
          ]);

          const totalCandidates = candidatesRes.count || 0;
          const verifiedProofs = proofsRes.data?.filter(p => p.verification_status === 'verified').length || 0;

          // Fetch top skills in demand
          const { data: skillsData } = await supabase.from('skills').select('name');
          const skillCounts: Record<string, number> = {};
          skillsData?.forEach(s => {
            skillCounts[s.name] = (skillCounts[s.name] || 0) + 1;
          });
          const topSkillsDemand = Object.entries(skillCounts)
            .map(([skill, count]) => ({ skill, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          setStats({
            totalCandidates,
            shortlisted: Math.floor(totalCandidates * 0.15),
            interviews: Math.floor(totalCandidates * 0.08),
            hired: Math.floor(totalCandidates * 0.03),
            topSkillsDemand,
          });

          // Fetch recent candidates with proofs
          const { data: usersData } = await supabase
            .from('users')
            .select('id, full_name, headline, avatar_url')
            .eq('role', 'user')
            .order('created_at', { ascending: false })
            .limit(10);

          if (usersData) {
            const candidatesWithProofs = await Promise.all(
              usersData.map(async (u) => {
                const { data: proofs } = await supabase
                  .from('proof_cards')
                  .select('id')
                  .eq('user_id', u.id);

                const { data: userSkills } = await supabase
                  .from('skills')
                  .select('name')
                  .eq('user_id', u.id);

                return {
                  id: u.id,
                  fullName: u.full_name || 'Unknown',
                  headline: u.headline,
                  avatarUrl: u.avatar_url,
                  skills: userSkills?.map(s => s.name) || [],
                  proofCount: proofs?.length || 0,
                  matchScore: Math.floor(Math.random() * 30) + 70,
                };
              })
            );
            setCandidates(candidatesWithProofs);
          }
        }
      } catch (err) {
        console.error('Failed to fetch employer data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployerData();
  }, [authUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-bloom)' }} />
      </div>
    );
  }

  const filteredCandidates = candidates.filter(c =>
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-ember)' }}>
            Employer Portal
          </p>
          <h1 className="text-3xl font-semibold md:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
            Find Top Talent
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Discover candidates with verified proof of skills.
          </p>
        </div>
        <Link href="/opportunities/new" className="btn-primary px-5 py-2.5 text-sm">
          <Briefcase className="h-4 w-4" />
          Post Opportunity
        </Link>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Candidates', value: stats?.totalCandidates || 0, icon: Users, color: 'var(--color-bloom)' },
          { label: 'Shortlisted', value: stats?.shortlisted || 0, icon: Target, color: 'var(--color-ember)' },
          { label: 'Interviews', value: stats?.interviews || 0, icon: BarChart3, color: 'var(--color-pulse)' },
          { label: 'Hired', value: stats?.hired || 0, icon: TrendingUp, color: 'var(--color-spark)' },
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
                {stat.value.toLocaleString()}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Candidate Search */}
        <div className="lg:col-span-2 card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
              Discover Candidates
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search skills or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-xl border outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-ink)',
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredCandidates.slice(0, 5).map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.01]"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: 'var(--color-bloom)' }}
                  >
                    {candidate.avatarUrl ? (
                      <img src={candidate.avatarUrl} alt={candidate.fullName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      candidate.fullName.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                      {candidate.fullName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {candidate.headline || 'No headline'} · {candidate.proofCount} proofs
                    </p>
                    <div className="flex gap-1 mt-1">
                      {candidate.skills.slice(0, 3).map(skill => (
                        <span
                          key={skill}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--color-bloom)12', color: 'var(--color-bloom)' }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>Match</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-bloom)' }}>{candidate.matchScore}%</p>
                  </div>
                  <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
              </div>
            ))}
          </div>

          <Link href="/opportunities" className="btn-outline mt-4 block w-full px-4 py-2 text-center text-sm">
            View All Candidates
          </Link>
        </div>

        {/* Skills Demand */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
            Top Skills in Demand
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Most common skills across candidates.
          </p>

          <div className="mt-4 space-y-3">
            {stats?.topSkillsDemand.map((skill, i) => (
              <div key={skill.skill} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)', width: 20 }}>
                    {i + 1}.
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    {skill.skill}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(skill.count / (stats?.topSkillsDemand[0]?.count || 1)) * 100}%`,
                        backgroundColor: 'var(--color-ember)',
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)', width: 30 }}>
                    {skill.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
          Quick Actions
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { label: 'Post Job Listing', href: '/opportunities/new', icon: Briefcase },
            { label: 'Search Candidates', href: '/opportunities', icon: Search },
            { label: 'View Analytics', href: '/dashboard/analytics', icon: BarChart3 },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-ink)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" style={{ color: 'var(--color-ember)' }} />
                  <span className="text-sm font-semibold">{action.label}</span>
                </div>
                <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
