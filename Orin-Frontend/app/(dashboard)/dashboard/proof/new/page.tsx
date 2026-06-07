'use client';

import { useState, useEffect } from 'react';
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
import { useUsage } from '@/lib/use-usage';
import { usePlan } from '@/lib/plan-context';
import { useAuth } from '@/lib/auth-context';
import { LimitReached, UpgradePrompt } from '@/components/UpgradePrompt';
import { supabase } from '@/lib/supabase';

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

const inputClass = "w-full rounded-xl border bg-white px-4 py-3 text-sm transition placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20";

export default function NewProofPage() {
  const router = useRouter();
  const usage = useUsage();
  const { isFree } = usePlan();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState<number | null>(null);

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

  const proofInfo = usage.get('proof_cards');
  const used = (liveCount ?? proofInfo.used);
  const isAtLimit = !proofInfo.isUnlimited && used >= proofInfo.limit;

  useEffect(() => {
    if (!user || !supabase) return;
    let cancelled = false;
    (async () => {
      try {
        const { count } = await supabase
          .from('proof_cards')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('deleted_at', null);
        if (!cancelled) setLiveCount(count ?? 0);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user]);

  const canProceed = () => {
    switch (currentStep) {
      case 1: return true;
      case 2: return title.trim().length > 0;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => { if (canProceed() && currentStep < 4) setCurrentStep(currentStep + 1); };
  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
  const addSkill = (skill: string) => { const trimmed = skill.trim(); if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed]); };
  const removeSkill = (skill: string) => { setSkills(skills.filter((s) => s !== skill)); };
  const handleAddCustomSkill = () => { if (customSkill.trim()) { addSkill(customSkill.trim()); setCustomSkill(''); } };

  const handleSubmit = async () => {
    if (isAtLimit) {
      setError('You\'ve reached the free plan limit of 5 proof cards. Upgrade to Pro for unlimited cards.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/proofs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_type: sourceType, title: title.trim(), source_url: sourceUrl || undefined, description: description || undefined, skills_extracted: skills }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to create proof card'); }
      const proofData = await res.json();
      usage.record('proof_cards');
      setLiveCount((c) => (c == null ? c : c + 1));
      if (autoVerify && sourceUrl && (sourceType === 'github' || sourceType === 'certificate' || sourceType === 'kaggle')) {
        setVerifying(true);
        try {
          const authRes = await fetch('/api/auth/session');
          const sessionData = await authRes.json();
          const token = sessionData?.access_token;
          if (token) {
            await fetch('/api/ai/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ action: 'verify', proofId: proofData.proof.id, proofUrl: sourceUrl, sourceType }),
            });
          }
        } catch (verifyErr) { console.warn('Auto-verification failed:', verifyErr); } finally { setVerifying(false); }
      }
      router.push('/dashboard');
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); } finally { setSubmitting(false); }
  };

  if (isAtLimit) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="animate-fadeInUp">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>New Proof Card</h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Free plan limit reached</p>
            </div>
            <button type="button" onClick={() => router.push('/dashboard')} className="btn-outline px-4 py-2 text-sm font-medium">
              Back
            </button>
          </div>
        </header>
        <LimitReached metric="proof_cards" limitInfo={{ ...proofInfo, used, limit: proofInfo.limit }} action="create proof cards" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="animate-fadeInUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>New Proof Card</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Step {currentStep} of {steps.length} · {used} of {proofInfo.limit} used</p>
          </div>
          <button type="button" onClick={() => router.push('/dashboard')} className="btn-outline px-4 py-2 text-sm font-medium">
            Cancel
          </button>
        </div>
      </header>

      {/* Usage meter for free users */}
      {isFree && !proofInfo.isUnlimited && proofInfo.percent >= 60 && (
        <UpgradePrompt
          variant="inline"
          metric="proof_cards"
          limitInfo={{ ...proofInfo, used }}
          reason="limit"
          compact
        />
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 animate-fadeInUp" style={{ animationDelay: '50ms' }}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300"
              style={{
                backgroundColor: currentStep > step.id ? 'var(--color-bloom)' : currentStep === step.id ? 'var(--color-bloom)12' : 'var(--color-surface)',
                color: currentStep > step.id ? 'white' : currentStep === step.id ? 'var(--color-bloom)' : 'var(--color-text-tertiary)',
                border: currentStep <= step.id ? `2px solid ${currentStep === step.id ? 'var(--color-bloom)' : 'var(--color-border)'}` : 'none',
              }}>
              {currentStep > step.id ? <Check size={14} /> : step.id}
            </div>
            {index < steps.length - 1 && (
              <div className="h-0.5 w-10 transition-colors duration-300" style={{ backgroundColor: currentStep > step.id ? 'var(--color-bloom)' : 'var(--color-border)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card-premium p-6 animate-scaleIn">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Select Source Type</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Choose what kind of proof you&apos;re adding.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {sourceTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button key={type.value} type="button" onClick={() => setSourceType(type.value)}
                    className="flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-medium transition-all duration-200"
                    style={{
                      borderColor: sourceType === type.value ? 'var(--color-bloom)' : 'var(--color-border)',
                      backgroundColor: sourceType === type.value ? 'var(--color-bloom)08' : 'transparent',
                      color: sourceType === type.value ? 'var(--color-bloom)' : 'var(--color-text-tertiary)',
                    }}>
                    <Icon size={20} />
                    {type.label}
                  </button>
                );
              })}
            </div>
            {selectedSource && <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{selectedSource.description}</p>}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Enter Details</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Provide the details for your proof card.</p>
            </div>
            <div>
              <label htmlFor="proofTitle" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                Title <span style={{ color: 'var(--color-pulse)' }}>*</span>
              </label>
              <input id="proofTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Open Source React Component Library" className={inputClass} style={{ borderColor: 'var(--color-border)' }} />
            </div>
            <div>
              <label htmlFor="proofUrl" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Source URL</label>
              <input id="proofUrl" type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder={selectedSource ? `e.g. ${selectedSource.value === 'github' ? 'https://github.com/user/repo' : 'https://example.com'}` : 'https://...'} className={inputClass} style={{ borderColor: 'var(--color-border)' }} />
            </div>
            <div>
              <label htmlFor="proofDesc" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Description</label>
              <textarea id="proofDesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe what this proof demonstrates..." className={`${inputClass} resize-none`} style={{ borderColor: 'var(--color-border)' }} />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Extract Skills</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Select skills that this proof demonstrates, or add your own.</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Suggested skills</p>
              <div className="flex flex-wrap gap-2">
                {suggestedForType.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <button key={skill} type="button" onClick={() => (isSelected ? removeSkill(skill) : addSkill(skill))}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200"
                      style={{
                        backgroundColor: isSelected ? 'var(--color-bloom)' : 'transparent',
                        color: isSelected ? 'white' : 'var(--color-text-tertiary)',
                        border: isSelected ? 'none' : '1px solid var(--color-border)',
                      }}>
                      {isSelected && <Check size={12} />}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Add custom skill</p>
              <div className="flex gap-2">
                <input type="text" value={customSkill} onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSkill(); } }}
                  placeholder="Type a skill and press Enter" className={inputClass} style={{ borderColor: 'var(--color-border)' }} />
                <button type="button" onClick={handleAddCustomSkill} disabled={!customSkill.trim()} className="rounded-xl border px-4 py-3 text-sm font-medium transition disabled:opacity-50" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
            {skills.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Selected skills ({skills.length})</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-bloom)12', color: 'var(--color-bloom)' }}>
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="rounded-full p-0.5 transition-colors hover:opacity-70"><X size={12} /></button>
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
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Review & Submit</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Review your proof card before submitting.</p>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Source Type', value: selectedSource?.label },
                { label: 'Title', value: title },
                sourceUrl ? { label: 'Source URL', value: sourceUrl, color: 'var(--color-bloom)' } : null,
                description ? { label: 'Description', value: description } : null,
              ].filter(Boolean).map((item) => item && (
                <div key={item.label} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-dim)' }}>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>{item.label}</p>
                  <p className="mt-1 text-sm font-medium" style={{ color: item.color || 'var(--color-ink)' }}>{item.value}</p>
                </div>
              ))}
              {skills.length > 0 && (
                <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-dim)' }}>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span key={skill} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--color-bloom)12', color: 'var(--color-bloom)' }}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {sourceUrl && (sourceType === 'github' || sourceType === 'certificate' || sourceType === 'kaggle') && (
                <div className="rounded-xl p-4" style={{ border: '1px solid var(--color-bloom)20', backgroundColor: 'var(--color-bloom)06' }}>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={autoVerify} onChange={(e) => setAutoVerify(e.target.checked)} className="h-4 w-4 rounded" style={{ accentColor: 'var(--color-bloom)' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Auto-verify with AI after submission</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>AI will verify your {sourceType === 'github' ? 'repository' : sourceType === 'certificate' ? 'certificate' : 'notebook'} exists and is valid</p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl p-3 text-sm" style={{ border: '1px solid var(--color-pulse)40', backgroundColor: 'var(--color-pulse)08', color: 'var(--color-pulse)' }}>
            {error}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
        <button type="button" onClick={handleBack} disabled={currentStep === 1}
          className="btn-outline inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium disabled:opacity-40">
          <ArrowLeft size={16} /> Back
        </button>
        {currentStep < 4 ? (
          <button type="button" onClick={handleNext} disabled={!canProceed()}
            className="btn-success inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting || verifying}
            className="btn-success inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
            {submitting ? (<><Loader2 size={16} className="animate-spin" /> Submitting...</>) : verifying ? (<><Loader2 size={16} className="animate-spin" /> Verifying with AI...</>) : (<><Check size={16} /> Submit Proof Card</>)}
          </button>
        )}
      </div>
    </div>
  );
}
