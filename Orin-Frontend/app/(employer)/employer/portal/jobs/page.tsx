'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  description: string;
  skills: string[];
  status: 'active' | 'draft' | 'closed';
  applicants: number;
  posted: string;
  salary?: string;
  location?: string;
  type?: string;
}

const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    description: 'We are looking for a senior frontend engineer to join our growing team. You will work on building beautiful, performant user interfaces using React and TypeScript.',
    skills: ['React', 'TypeScript', 'CSS', 'GraphQL'],
    status: 'active',
    applicants: 18,
    posted: '3 days ago',
    salary: '$150K - $200K',
    location: 'Remote (US)',
    type: 'Full-time',
  },
  {
    id: '2',
    title: 'Full Stack Developer',
    description: 'Join our team to build end-to-end features using Node.js and React. You will work across the entire stack.',
    skills: ['Node.js', 'React', 'PostgreSQL', 'AWS'],
    status: 'active',
    applicants: 6,
    posted: '1 week ago',
    salary: '$130K - $170K',
    location: 'Austin, TX (Hybrid)',
    type: 'Full-time',
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    description: 'Help us build and maintain our cloud infrastructure. Experience with Kubernetes and Terraform required.',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD'],
    status: 'draft',
    applicants: 0,
    posted: '2 weeks ago',
  },
];

export default function JobsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    skills: [] as string[],
    salary: '',
    location: '',
    type: 'Full-time',
  });

  const ALL_SKILLS = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'GraphQL', 'Go'];

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
      <div className="space-y-4">
        {MOCK_JOBS.map((job) => (
          <div key={job.id} className="card-premium p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>{job.title}</h3>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{
                    backgroundColor: job.status === 'active' ? 'var(--color-bloom)' : job.status === 'draft' ? 'var(--color-surface-dim)' : 'var(--color-pulse)',
                    color: job.status === 'active' ? 'white' : job.status === 'draft' ? 'var(--color-text-tertiary)' : 'white',
                  }}>
                    {job.status}
                  </span>
                </div>
                <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {job.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {job.skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {job.salary && <span>💰 {job.salary}</span>}
                  {job.location && <span>📍 {job.location}</span>}
                  {job.type && <span>⏰ {job.type}</span>}
                  <span>📅 Posted {job.posted}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold" style={{ color: 'var(--color-ember)' }}>{job.applicants}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>applicants</div>
                <div className="flex gap-2 mt-3">
                  <button className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                    Edit
                  </button>
                  <button className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                  <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Job Title</label>
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
                    <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Salary Range</label>
                    <input
                      type="text"
                      value={newJob.salary}
                      onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                      placeholder="e.g. $150K - $200K"
                      className="w-full mt-1 rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Location</label>
                    <input
                      type="text"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      placeholder="e.g. Remote (US)"
                      className="w-full mt-1 rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
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
                  <button className="flex-1 btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold">
                    Publish Job
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
