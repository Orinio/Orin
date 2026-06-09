'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';

export default function EmployerPortal() {
  const { user: authUser } = useAuth();
  const [currentDbUserId, setCurrentDbUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!supabase || !authUser?.id) return;
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();
      if (data) setCurrentDbUserId(data.id);
    };
    fetchUser();
  }, [authUser?.id]);

  // Fetch real stats
  const { data: stats } = useQuery({
    queryKey: ['employer-stats', currentDbUserId],
    queryFn: async () => {
      if (!supabase || !currentDbUserId) return null;

      const { count: jobCount } = await supabase
        .from('opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', currentDbUserId)
        .eq('is_active', true);

      const { count: proofCount } = await supabase
        .from('proof_cards')
        .select('id', { count: 'exact', head: true })
        .eq('verification_status', 'verified');

      return {
        activeJobs: jobCount || 0,
        verifiedProofs: proofCount || 0,
      };
    },
    enabled: !!currentDbUserId,
  });

  // Fetch recent opportunities posted by this user
  const { data: recentJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['employer-recent-jobs', currentDbUserId],
    queryFn: async () => {
      if (!supabase || !currentDbUserId) return [];

      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('created_by', currentDbUserId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentDbUserId,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}>
            Employer Portal
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Find verified talent with proof, not promises.
          </p>
        </div>
        <Link
          href="/employer/portal/talent"
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          🔍 Search Talent
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Jobs', value: stats?.activeJobs || 0, icon: '💼', color: 'var(--color-ember)' },
          { label: 'Verified Proofs', value: stats?.verifiedProofs || 0, icon: '✅', color: 'var(--color-bloom)' },
          { label: 'Talent Pool', value: stats?.verifiedProofs || 0, icon: '👥', color: 'var(--color-pulse)' },
          { label: 'Total Opportunities', value: stats?.activeJobs || 0, icon: '🎯', color: 'var(--color-spark)' },
        ].map((stat) => (
          <div key={stat.label} className="card-premium p-5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold" style={{ color: stat.color, fontFamily: 'var(--font-heading)' }}>
                {stat.value}
              </div>
              <div className="text-xs font-medium mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/employer/portal/talent" className="card-premium p-6 hover-lift text-center">
          <span className="text-3xl">🔍</span>
          <h3 className="text-base font-semibold mt-2" style={{ color: 'var(--color-ink)' }}>Search Talent</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Find candidates with verified proof</p>
        </Link>
        <Link href="/employer/portal/jobs" className="card-premium p-6 hover-lift text-center">
          <span className="text-3xl">💼</span>
          <h3 className="text-base font-semibold mt-2" style={{ color: 'var(--color-ink)' }}>Manage Jobs</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Post and track job listings</p>
        </Link>
        <Link href="/opportunities" className="card-premium p-6 hover-lift text-center">
          <span className="text-3xl">📊</span>
          <h3 className="text-base font-semibold mt-2" style={{ color: 'var(--color-ink)' }}>Browse Opportunities</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>See all available opportunities</p>
        </Link>
      </div>

      {/* Recent jobs */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
            Your Job Postings
          </h2>
          <Link href="/employer/portal/jobs" className="text-sm font-medium" style={{ color: 'var(--color-bloom)' }}>
            View all →
          </Link>
        </div>
        {jobsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-4 rounded-xl" style={{ border: '1px solid var(--color-border)' }}>
                <div className="h-4 w-48 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                <div className="h-3 w-32 rounded mt-2" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
              </div>
            ))}
          </div>
        ) : recentJobs && recentJobs.length > 0 ? (
          <div className="space-y-3">
            {recentJobs.map((job: any) => (
              <div key={job.id} className="flex items-center justify-between p-4 rounded-xl transition-colors" style={{ border: '1px solid var(--color-border)' }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{job.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                    {job.location || 'Remote'} · Posted {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{
                  backgroundColor: job.is_active ? 'var(--color-bloom)' : 'var(--color-surface-dim)',
                  color: job.is_active ? 'white' : 'var(--color-text-tertiary)',
                }}>
                  {job.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-3xl">📋</span>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
              No job postings yet.{' '}
              <Link href="/employer/portal/jobs" style={{ color: 'var(--color-bloom)' }}>Create your first job →</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
