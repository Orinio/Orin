'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  GitFork,
  BarChart3,
  Award,
  Trophy,
  Folder,
  FileText,
  Globe,
  MoreHorizontal,
  X,
  Plus,
  Check,
  Loader2,
} from 'lucide-react';
import type { ProofSourceType } from '@/lib/types';

interface Step {
  id: number;
  label: string;
}

const steps: Step[] = [
  { id: 1, label: 'Source Type' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Skills' },
  { id: 4, label: 'Review' },
];

const sourceTypes: {
  value: ProofSourceType;
  label: string;
  icon: typeof GitFork;
  description: string;
}[] = [
  { value: 'github', label: 'GitHub', icon: GitFork, description: 'Repositories, contributions, and commit history' },
  { value: 'kaggle', label: 'Kaggle', icon: BarChart3, description: 'Competitions, datasets, and notebooks' },
  { value: 'certificate', label: 'Certificate', icon: Award, description: 'Online courses, certifications, and badges' },
  { value: 'hackathon', label: 'Hackathon', icon: Trophy, description: 'Hackathon wins, participation, and projects' },
  { value: 'project', label: 'Project', icon: Folder, description: 'Personal or professional projects' },
  { value: 'blog', label: 'Blog / Article', icon: FileText, description: 'Technical blog posts and articles' },
  { value: 'demo', label: 'Demo / Live Site', icon: Globe, description: 'Live deployments and demo links' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, description: 'Any other proof of work' },
];

const suggestedSkills: Record<ProofSourceType, string[]> = {
  github: ['Git', 'TypeScript', 'Python', 'Open Source', 'Code Review'],
  kaggle: ['Machine Learning', 'Data Science', 'Python', 'Pandas', 'Statistics'],
  certificate: ['Cloud Computing', 'Data Analytics', 'Project Management', 'Agile'],
  hackathon: ['Rapid Prototyping', 'Teamwork', 'Pitching', 'Full Stack'],
  project: ['Product Development', 'UI/UX', 'Architecture', 'Testing'],
  blog: ['Technical Writing', 'Communication', 'Documentation', 'Research'],
  demo: ['Frontend', 'Deployment', 'Performance', 'Accessibility'],
  other: ['Problem Solving', 'Leadership', 'Communication'],
};

export default function NewProofPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [sourceType, setSourceType] = useState<ProofSourceType>('github');
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [autoVerify, setAutoVerify] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const selectedSource = sourceTypes.find((s) => s.value === sourceType);
  const suggestedForType = suggestedSkills[sourceType];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return title.trim().length > 0;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim()) {
      addSkill(customSkill.trim());
      setCustomSkill('');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/proofs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: sourceType,
          title: title.trim(),
          source_url: sourceUrl || undefined,
          description: description || undefined,
          skills: skills,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create proof card');
      }
      const proofData = await res.json();

      if (autoVerify && sourceUrl && (sourceType === 'github' || sourceType === 'certificate' || sourceType === 'kaggle')) {
        setVerifying(true);
        try {
          const authRes = await fetch('/api/auth/session');
          const sessionData = await authRes.json();
          const token = sessionData?.access_token;

          if (token) {
            await fetch('/api/ai/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                action: 'verify',
                proofId: proofData.id,
                proofUrl: sourceUrl,
                sourceType: sourceType,
              }),
            });
          }
        } catch (verifyErr) {
          console.warn('Auto-verification failed, proof created successfully:', verifyErr);
        } finally {
          setVerifying(false);
        }
      }

      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-neutral-text)] font-serif">
            New Proof Card
          </h1>
          <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
            Step {currentStep} of {steps.length}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="rounded-lg border border-[var(--color-neutral-border)] px-4 py-2 text-sm font-medium text-[var(--color-neutral-text-secondary)] transition hover:border-[var(--color-primary-emerald)] hover:text-[var(--color-primary-emerald)]"
        >
          Cancel
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                currentStep > step.id
                  ? 'bg-[var(--color-primary-emerald)] text-white'
                  : currentStep === step.id
                    ? 'border-2 border-[var(--color-primary-emerald)] bg-[var(--color-primary-soft)] text-[var(--color-primary-emerald)]'
                    : 'border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] text-[var(--color-neutral-text-tertiary)]'
              }`}
            >
              {currentStep > step.id ? <Check size={14} /> : step.id}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 ${
                  currentStep > step.id ? 'bg-[var(--color-primary-emerald)]' : 'bg-[var(--color-neutral-border)]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-neutral-text)]">Select Source Type</h2>
              <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
                Choose what kind of proof you&apos;re adding.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {sourceTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSourceType(type.value)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-xs font-medium transition ${
                      sourceType === type.value
                        ? 'border-[var(--color-primary-emerald)] bg-[var(--color-primary-soft)] text-[var(--color-primary-emerald)]'
                        : 'border-[var(--color-neutral-border)] text-[var(--color-neutral-text-secondary)] hover:border-[var(--color-primary-emerald)] hover:text-[var(--color-primary-emerald)]'
                    }`}
                  >
                    <Icon size={20} />
                    {type.label}
                  </button>
                );
              })}
            </div>
            {selectedSource && (
              <p className="text-xs text-[var(--color-neutral-text-tertiary)]">
                {selectedSource.description}
              </p>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-neutral-text)]">Enter Details</h2>
              <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
                Provide the details for your proof card.
              </p>
            </div>

            <div>
              <label htmlFor="proofTitle" className="mb-1.5 block text-sm font-medium text-[var(--color-neutral-text)]">
                Title <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                id="proofTitle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Open Source React Component Library"
                className="w-full rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3.5 py-2.5 text-sm text-[var(--color-neutral-text)] placeholder:text-[var(--color-neutral-text-tertiary)] transition focus:border-[var(--color-primary-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
              />
            </div>

            <div>
              <label htmlFor="proofUrl" className="mb-1.5 block text-sm font-medium text-[var(--color-neutral-text)]">
                Source URL
              </label>
              <input
                id="proofUrl"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder={selectedSource ? `e.g. ${selectedSource.value === 'github' ? 'https://github.com/user/repo' : 'https://example.com'}` : 'https://...'}
                className="w-full rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3.5 py-2.5 text-sm text-[var(--color-neutral-text)] placeholder:text-[var(--color-neutral-text-tertiary)] transition focus:border-[var(--color-primary-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
              />
            </div>

            <div>
              <label htmlFor="proofDesc" className="mb-1.5 block text-sm font-medium text-[var(--color-neutral-text)]">
                Description
              </label>
              <textarea
                id="proofDesc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this proof demonstrates..."
                className="w-full resize-none rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3.5 py-2.5 text-sm text-[var(--color-neutral-text)] placeholder:text-[var(--color-neutral-text-tertiary)] transition focus:border-[var(--color-primary-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-neutral-text)]">Extract Skills</h2>
              <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
                Select skills that this proof demonstrates, or add your own.
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-neutral-text-tertiary)]">
                Suggested skills
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedForType.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => (isSelected ? removeSkill(skill) : addSkill(skill))}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        isSelected
                          ? 'bg-[var(--color-primary-emerald)] text-white'
                          : 'border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] text-[var(--color-neutral-text-secondary)] hover:border-[var(--color-primary-emerald)] hover:text-[var(--color-primary-emerald)]'
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-neutral-text-tertiary)]">
                Add custom skill
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                  placeholder="Type a skill and press Enter"
                  className="flex-1 rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3.5 py-2.5 text-sm text-[var(--color-neutral-text)] placeholder:text-[var(--color-neutral-text-tertiary)] transition focus:border-[var(--color-primary-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  disabled={!customSkill.trim()}
                  className="rounded-lg border border-[var(--color-neutral-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-neutral-text)] transition hover:border-[var(--color-primary-emerald)] hover:text-[var(--color-primary-emerald)] disabled:opacity-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {skills.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-neutral-text-tertiary)]">
                  Selected skills ({skills.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary-emerald)]"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="rounded-full p-0.5 hover:bg-[var(--color-primary-emerald)]/20"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-neutral-text)]">Review & Submit</h2>
              <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
                Review your proof card before submitting.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-neutral-text-tertiary)]">
                  Source Type
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-neutral-text)]">
                  {selectedSource?.label}
                </p>
              </div>

              <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-neutral-text-tertiary)]">
                  Title
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-neutral-text)]">{title}</p>
              </div>

              {sourceUrl && (
                <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-neutral-text-tertiary)]">
                    Source URL
                  </p>
                  <p className="mt-1 break-all text-sm text-[var(--color-primary-emerald)]">{sourceUrl}</p>
                </div>
              )}

              {description && (
                <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-neutral-text-tertiary)]">
                    Description
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">{description}</p>
                </div>
              )}

              {skills.length > 0 && (
                <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-neutral-text-tertiary)]">
                    Skills
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-medium text-[var(--color-primary-emerald)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {sourceUrl && (sourceType === 'github' || sourceType === 'certificate' || sourceType === 'kaggle') && (
                <div className="rounded-lg border border-[var(--color-primary-emerald)]/20 bg-[var(--color-primary-soft)]/10 p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoVerify}
                      onChange={(e) => setAutoVerify(e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--color-neutral-border)] text-[var(--color-primary-emerald)] focus:ring-[var(--color-primary-emerald)]"
                    />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-neutral-text)]">
                        Auto-verify with AI after submission
                      </p>
                      <p className="text-xs text-[var(--color-neutral-text-secondary)]">
                        AI will verify your {sourceType === 'github' ? 'repository' : sourceType === 'certificate' ? 'certificate' : 'notebook'} exists and is valid
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-neutral-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-neutral-text)] transition hover:border-[var(--color-primary-emerald)] hover:text-[var(--color-primary-emerald)] disabled:opacity-40"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="btn-green inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Next
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || verifying}
            className="btn-green inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : verifying ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Verifying with AI...
              </>
            ) : (
              <>
                <Check size={16} />
                Submit Proof Card
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
