'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Code2,
  Palette,
  BarChart3,
  Brain,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Check,
  Github,
  ExternalLink,
  Star,
  Zap,
  Target,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Logo from '@/components/Logo';

const ROLES = [
  { id: 'engineer', label: 'Software Engineer', icon: Code2, color: 'var(--color-bloom)' },
  { id: 'designer', label: 'Designer', icon: Palette, color: 'var(--color-pulse)' },
  { id: 'data', label: 'Data / ML', icon: BarChart3, color: 'var(--color-ember)' },
  { id: 'pm', label: 'Product Manager', icon: Target, color: 'var(--color-spark)' },
  { id: 'other', label: 'Other', icon: Brain, color: '#6366f1' },
];

const GOALS = [
  { id: 'job', label: 'Get hired', icon: Rocket },
  { id: 'freelance', label: 'Find clients', icon: ExternalLink },
  { id: 'network', label: 'Build network', icon: Star },
  { id: 'learn', label: 'Track growth', icon: Zap },
];

const SOURCES = [
  { id: 'github', label: 'GitHub', icon: Github, color: '#333' },
  { id: 'linkedin', label: 'LinkedIn', icon: ExternalLink, color: '#0077b5' },
  { id: 'kaggle', label: 'Kaggle', icon: BarChart3, color: '#20beff' },
  { id: 'certificate', label: 'Certificate', icon: Star, color: 'var(--color-spark)' },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 200 : -200,
    opacity: 0,
  }),
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) return;
      const { data: { user: authUserData } } = await supabase.auth.getUser();
      if (!authUserData) {
        router.push('/signup');
        return;
      }
      const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, headline')
        .eq('auth_user_id', authUserData.id)
        .maybeSingle();

      if (userData) {
        setDbUserId(userData.id);
        setFullName(userData.full_name || '');
        setHeadline(userData.headline || '');
        // Check if user already has a profile (skip onboarding)
        if (userData.full_name && userData.headline) {
          router.push('/dashboard');
        }
      }
    };
    checkUser();
  }, [router]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 15) {
      setSkills([...skills, s]);
      setSkillInput('');
    }
  };

  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  const toggleGoal = (id: string) => {
    setGoals((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSource = (id: string) => {
    setSelectedSources((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const next = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 4));
  };

  const prev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      if (supabase && dbUserId) {
        await supabase.from('users').update({
          full_name: fullName || undefined,
          headline: headline || `${role} · ${skills.slice(0, 3).join(', ')}`,
        }).eq('id', dbUserId);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('orin.onboarded', 'true');
      }
      router.push('/dashboard');
    } catch (e) {
      console.error('Failed to save onboarding:', e);
      router.push('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return role !== '';
      case 1: return skills.length > 0;
      case 2: return goals.length > 0;
      case 3: return true; // sources are optional
      case 4: return true;
      default: return true;
    }
  };

  const progress = ((step + 1) / 5) * 100;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Logo variant="full" size="md" href="/" />
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Skip <X className="h-4 w-4" />
        </button>
      </header>

      {/* Progress bar */}
      <div className="px-6">
        <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
          <motion.div
            className="h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--color-bloom)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <div className="mt-2 flex justify-between">
          {['Role', 'Skills', 'Goals', 'Sources', 'Done'].map((label, i) => (
            <span
              key={label}
              className="text-[11px] font-semibold transition-colors duration-300"
              style={{ color: i <= step ? 'var(--color-bloom)' : 'var(--color-text-tertiary)' }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 0: Role */}
            {step === 0 && (
              <motion.div
                key="role"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}>
                  What do you do?
                </h1>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  This helps us tailor your experience and proof categories.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const selected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className="relative flex items-center gap-3 rounded-2xl p-4 text-left transition-all duration-200"
                        style={{
                          border: `2px solid ${selected ? r.color : 'var(--color-border)'}`,
                          backgroundColor: selected ? `${r.color}08` : 'transparent',
                          transform: selected ? 'scale(1.02)' : 'scale(1)',
                        }}
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${r.color}15` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: r.color }} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{r.label}</span>
                        {selected && (
                          <div
                            className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full"
                            style={{ backgroundColor: r.color }}
                          >
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 1: Skills */}
            {step === 1 && (
              <motion.div
                key="skills"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}>
                  Your top skills
                </h1>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  Add at least 3 skills. These will be used to match you with opportunities.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all"
                      style={{ backgroundColor: 'var(--color-bloom)12', color: 'var(--color-bloom)' }}
                    >
                      {s}
                      <button onClick={() => removeSkill(s)} className="hover:opacity-70">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                    placeholder="Type a skill and press Enter..."
                    className="flex-1 rounded-xl border bg-white px-4 py-3 text-sm transition placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                  <button
                    onClick={addSkill}
                    disabled={!skillInput.trim()}
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-40"
                    style={{ backgroundColor: 'var(--color-bloom)' }}
                  >
                    Add
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['React', 'Python', 'TypeScript', 'Node.js', 'Java', 'C++', 'Go', 'Rust', 'SQL', 'AWS', 'Docker', 'Figma'].map((s) => (
                    <button
                      key={s}
                      onClick={() => { if (!skills.includes(s)) setSkills([...skills, s]); }}
                      disabled={skills.includes(s)}
                      className="rounded-full px-3 py-1 text-xs font-medium transition-all disabled:opacity-30"
                      style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)' }}
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Goals */}
            {step === 2 && (
              <motion.div
                key="goals"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}>
                  What&apos;s your goal?
                </h1>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  Select all that apply. We&apos;ll prioritize features that help you.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {GOALS.map((g) => {
                    const Icon = g.icon;
                    const selected = goals.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        onClick={() => toggleGoal(g.id)}
                        className="relative flex flex-col items-center gap-3 rounded-2xl p-6 text-center transition-all duration-200"
                        style={{
                          border: `2px solid ${selected ? 'var(--color-bloom)' : 'var(--color-border)'}`,
                          backgroundColor: selected ? 'var(--color-bloom)08' : 'transparent',
                          transform: selected ? 'scale(1.02)' : 'scale(1)',
                        }}
                      >
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl"
                          style={{ backgroundColor: selected ? 'var(--color-bloom)15' : 'var(--color-surface-dim)' }}
                        >
                          <Icon className="h-6 w-6" style={{ color: selected ? 'var(--color-bloom)' : 'var(--color-text-tertiary)' }} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{g.label}</span>
                        {selected && (
                          <div className="absolute right-3 top-3 h-5 w-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-bloom)' }}>
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 3: Sources */}
            {step === 3 && (
              <motion.div
                key="sources"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}>
                  Connect your work
                </h1>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  Link platforms where you have proof of your work. You can add more later.
                </p>
                <div className="mt-8 space-y-3">
                  {SOURCES.map((s) => {
                    const Icon = s.icon;
                    const selected = selectedSources.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleSource(s.id)}
                        className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200"
                        style={{
                          border: `2px solid ${selected ? s.color : 'var(--color-border)'}`,
                          backgroundColor: selected ? `${s.color}08` : 'transparent',
                        }}
                      >
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${s.color}15` }}
                        >
                          <Icon className="h-6 w-6" style={{ color: s.color }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{s.label}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            Import your work and contributions
                          </p>
                        </div>
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-full transition-all"
                          style={{
                            border: `2px solid ${selected ? s.color : 'var(--color-border)'}`,
                            backgroundColor: selected ? s.color : 'transparent',
                          }}
                        >
                          {selected && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                  Optional — you can skip this and add sources later from the dashboard.
                </p>
              </motion.div>
            )}

            {/* Step 4: Done */}
            {step === 4 && (
              <motion.div
                key="done"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'var(--color-bloom)12' }}
                >
                  <Sparkles className="h-10 w-10" style={{ color: 'var(--color-bloom)' }} />
                </motion.div>
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}>
                  You&apos;re all set!
                </h1>
                <p className="mt-3 text-sm max-w-sm mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
                  Your profile is ready. Here&apos;s what we set up for you:
                </p>
                <div className="mt-6 space-y-2 max-w-sm mx-auto text-left">
                  {role && (
                    <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ backgroundColor: 'var(--color-bloom)08' }}>
                      <Check className="h-4 w-4" style={{ color: 'var(--color-bloom)' }} />
                      <span className="text-sm" style={{ color: 'var(--color-ink)' }}>Role: {ROLES.find((r) => r.id === role)?.label}</span>
                    </div>
                  )}
                  {skills.length > 0 && (
                    <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ backgroundColor: 'var(--color-ember)08' }}>
                      <Check className="h-4 w-4" style={{ color: 'var(--color-ember)' }} />
                      <span className="text-sm" style={{ color: 'var(--color-ink)' }}>{skills.length} skills added</span>
                    </div>
                  )}
                  {goals.length > 0 && (
                    <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ backgroundColor: 'var(--color-pulse)08' }}>
                      <Check className="h-4 w-4" style={{ color: 'var(--color-pulse)' }} />
                      <span className="text-sm" style={{ color: 'var(--color-ink)' }}>{goals.length} goals set</span>
                    </div>
                  )}
                  {selectedSources.length > 0 && (
                    <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ backgroundColor: 'var(--color-spark)08' }}>
                      <Check className="h-4 w-4" style={{ color: 'var(--color-spark)' }} />
                      <span className="text-sm" style={{ color: 'var(--color-ink)' }}>{selectedSources.length} sources connected</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 pt-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {step > 0 ? (
            <button
              onClick={prev}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              onClick={next}
              disabled={!canProceed()}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
              style={{ backgroundColor: 'var(--color-bloom)' }}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-bloom)' }}
            >
              {saving ? 'Saving...' : 'Go to Dashboard'}
              <Rocket className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
