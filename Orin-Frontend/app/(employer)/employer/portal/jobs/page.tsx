'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function JobsPage() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentDbUserId, setCurrentDbUserId] = useState<string | null>(null);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    description: '',
    skills: [] as string[],
    salaryMin: '',
    salaryMax: '',
    location: '',
    isRemote: false,
    link: '',
  });

  const ALL_SKILLS = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'GraphQL', 'Go'];

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

  // Fetch jobs created by this employer
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['employer-jobs', currentDbUserId],
    queryFn: async () => {
      if (!supabase || !currentDbUserId) return [];

      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('created_by', currentDbUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentDbUserId,
  });

  // Create job mutation
  const createJob = useMutation({
    mutationFn: async (job: typeof newJob) => {
      if (!supabase || !currentDbUserId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          title: job.title,
          company: job.company,
          description: job.description || null,
          location: job.location || null,
          is_remote: job.isRemote,
          link: job.link || '#',
          required_skills: job.skills,
          salary_min: job.salaryMin ? Number(job.salaryMin) : null,
          salary_max: job.salaryMax ? Number(job.salaryMax) : null,
          type: 'job',
          is_active: true,
          created_by: currentDbUserId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
      setShowCreateModal(false);
      setNewJob({ title: '', company: '', description: '', skills: [], salaryMin: '', salaryMax: '', location: '', isRemote: false, link: '' });
    },
  });

  const handlePublish = () => {
    if (!newJob.title.trim() || !newJob.company.trim()) return;
    createJob.mutate(newJob);
  };

  const toggleJobSkill = (skill: string) => {
    setNewJob((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/employer/portal" className="text-xs font-medium mb-1 inline-block" style={{ color: 'var(--color-bloom)' }}>
            ← Back to Portal
          </Link>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}>
            Job Postings
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Manage your job listings and track applicants.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          + Post New Job
        </button>
      </div>

      {/* Jobs list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-premium p-6 animate-pulse">
              <div className="h-5 w-48 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
              <div className="h-3 w-64 rounded mt-3" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
            </div>
          ))}
        </div>
      ) : jobs && jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job: any) => (
            <div key={job.id} className="card-premium p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>{job.title}</h3>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{
                      backgroundColor: job.is_active ? 'var(--color-bloom)' : 'var(--color-surface-dim)',
                      color: job.is_active ? 'white' : 'var(--color-text-tertiary)',
                    }}>
                      {job.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{job.company}</p>
                  {job.description && (
                    <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--color-text-tertiary)' }}>
                      {job.description}
                    </p>
                  )}
                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.required_skills.map((skill: string) => (
                        <span key={skill} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {job.salary_min && <span>💰 ${job.salary_min.toLocaleString()}{job.salary_max ? ` - $${job.salary_max.toLocaleString()}` : ''}</span>}
                    {job.location && <span>📍 {job.location}</span>}
                    {job.is_remote && <span>🌐 Remote</span>}
                    <span>📅 {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <span className="text-4xl">📋</span>
          <h3 className="text-lg font-semibold mt-3" style={{ color: 'var(--color-ink)' }}>No job postings yet</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Create your first job posting to attract verified talent.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            + Post Your First Job
          </button>
        </div>
      )}

      {/* Create Job Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg card-premium p-6 space-y-4 max-h-[80vh] overflow-y-auto"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
                  Post New Job
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="text-xl" style={{ color: 'var(--color-text-tertiary)' }}>×</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Job Title *</label>
                  <input
                    type="text"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full mt-1 rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Company *</label>
                  <input
                    type="text"
                    value={newJob.company}
                    onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    className="w-full mt-1 rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Description</label>
                  <textarea
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    rows={4}
                    className="w-full mt-1 rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20 resize-none"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Min Salary</label>
                    <input
                      type="number"
                      value={newJob.salaryMin}
                      onChange={(e) => setNewJob({ ...newJob, salaryMin: e.target.value })}
                      placeholder="e.g. 100000"
                      className="w-full mt-1 rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Max Salary</label>
                    <input
                      type="number"
                      value={newJob.salaryMax}
                      onChange={(e) => setNewJob({ ...newJob, salaryMax: e.target.value })}
                      placeholder="e.g. 200000"
                      className="w-full mt-1 rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Location</label>
                    <input
                      type="text"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full mt-1 rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Application Link</label>
                    <input
                      type="url"
                      value={newJob.link}
                      onChange={(e) => setNewJob({ ...newJob, link: e.target.value })}
                      placeholder="https://..."
                      className="w-full mt-1 rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                    <input
                      type="checkbox"
                      checked={newJob.isRemote}
                      onChange={(e) => setNewJob({ ...newJob, isRemote: e.target.checked })}
                      className="rounded accent-[var(--color-bloom)]"
                    />
                    Remote friendly
                  </label>
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Required Skills</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ALL_SKILLS.map((skill) => (
                      <button
                        key={skill}
                        onClick={() => toggleJobSkill(skill)}
                        className="rounded-full px-3 py-1 text-xs font-medium transition-all"
                        style={{
                          backgroundColor: newJob.skills.includes(skill) ? 'var(--color-bloom)' : 'var(--color-surface-dim)',
                          color: newJob.skills.includes(skill) ? 'white' : 'var(--color-text-secondary)',
                          border: `1px solid ${newJob.skills.includes(skill) ? 'var(--color-bloom)' : 'var(--color-border)'}`,
                        }}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                    style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={!newJob.title.trim() || !newJob.company.trim() || createJob.isPending}
                    className="flex-1 btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                  >
                    {createJob.isPending ? 'Publishing...' : 'Publish Job'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
