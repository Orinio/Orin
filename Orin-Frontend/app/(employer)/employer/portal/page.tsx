'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Active Jobs', value: '3', icon: '💼', change: '+1 this week', color: 'var(--color-ember)' },
  { label: 'Applications', value: '24', icon: '📨', change: '+8 today', color: 'var(--color-pulse)' },
  { label: 'Saved Candidates', value: '12', icon: '⭐', change: '+3 this week', color: 'var(--color-spark)' },
  { label: 'Profile Views', value: '189', icon: '👀', change: '+32 this week', color: 'var(--color-bloom)' },
];

const recentApplicants = [
  { name: 'Sarah Chen', role: 'Senior Frontend Engineer', proofScore: 92, skills: ['React', 'TypeScript', 'System Design'], avatar: '👩‍💻', applied: '2 hours ago' },
  { name: 'Marcus Johnson', role: 'Full Stack Developer', proofScore: 87, skills: ['Node.js', 'React', 'AWS'], avatar: '👨‍💻', applied: '5 hours ago' },
  { name: 'Priya Patel', role: 'Backend Engineer', proofScore: 84, skills: ['Python', 'PostgreSQL', 'Docker'], avatar: '👩‍🔧', applied: '1 day ago' },
  { name: 'Alex Rivera', role: 'DevOps Engineer', proofScore: 78, skills: ['Kubernetes', 'Terraform', 'CI/CD'], avatar: '🧑‍💻', applied: '2 days ago' },
];

const activeJobs = [
  { title: 'Senior Frontend Engineer', applicants: 18, status: 'active', posted: '3 days ago' },
  { title: 'Full Stack Developer', applicants: 6, status: 'active', posted: '1 week ago' },
  { title: 'DevOps Engineer', applicants: 0, status: 'draft', posted: '2 weeks ago' },
];

export default function EmployerPortal() {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'talent'>('overview');

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

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
        {(['overview', 'jobs', 'talent'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all capitalize"
            style={{
              backgroundColor: activeTab === tab ? 'var(--color-surface)' : 'transparent',
              color: activeTab === tab ? 'var(--color-ink)' : 'var(--color-text-tertiary)',
              boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="card-premium p-5">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                    {stat.change}
                  </span>
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

          {/* Recent Applicants */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
                Recent Applicants
              </h2>
              <Link href="/employer/portal/talent" className="text-sm font-medium" style={{ color: 'var(--color-bloom)' }}>
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {recentApplicants.map((applicant) => (
                <div key={applicant.name} className="flex items-center gap-4 p-3 rounded-xl transition-colors" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                    {applicant.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{applicant.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{applicant.applied}</div>
                  </div>
                  <div className="hidden sm:flex gap-1">
                    {applicant.skills.slice(0, 2).map((skill) => (
                      <span key={skill} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: 'var(--color-bloom)' }}>{applicant.proofScore}</div>
                    <div className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>Proof Score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'jobs' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex justify-end">
            <button className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold">
              + Post New Job
            </button>
          </div>
          {activeJobs.map((job) => (
            <div key={job.title} className="card-premium p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>{job.title}</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Posted {job.posted}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {job.applicants} applicants
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    job.status === 'active' ? 'text-white' : ''
                  }`} style={{
                    backgroundColor: job.status === 'active' ? 'var(--color-bloom)' : 'var(--color-surface-dim)',
                    color: job.status === 'active' ? 'white' : 'var(--color-text-tertiary)',
                  }}>
                    {job.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {activeTab === 'talent' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/employer/portal/talent" className="card-premium p-8 flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow cursor-pointer">
            <span className="text-4xl mb-3">🔍</span>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Search Verified Talent</h3>
            <p className="text-sm mt-1 max-w-md" style={{ color: 'var(--color-text-tertiary)' }}>
              Find candidates with verified proof cards, not just resumes. Filter by skills, proof score, and experience.
            </p>
            <span className="btn-primary mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold">
              Open Talent Search →
            </span>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
