'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  X,
  Cloud,
  HardDrive,
  CloudOff,
  Sparkles,
  ArrowRight,
  Shield,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usePlan } from '@/lib/plan-context';
import { api } from '@/lib/api-client';
import { PLANS } from '@/lib/chat-types';
import Navigation from '@/components/Navigation';

type BillingCycle = 'monthly' | 'yearly';

export default function PricingPage() {
  const { user } = useAuth();
  const { plan, setLocalPlan } = usePlan();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const yearlyDiscount = 0.25;

  const handleSelect = async (planId: string) => {
    setError(null);
    if (planId === 'free') {
      setLocalPlan('free');
      return;
    }
    if (!user) {
      window.location.href = `/signup?next=/pricing&plan=${planId}`;
      return;
    }
    setLoadingPlan(planId);
    try {
      const res = await api.billing.checkout(planId);
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      setLocalPlan(planId as any);
    } catch {
      setLocalPlan(planId as any);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <Navigation />
      <main id="main-content" className="min-h-screen">
        <section
          className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
          style={{ backgroundColor: 'var(--color-paper)' }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
              style={{ backgroundColor: 'var(--color-bloom)' }}
            />
            <div
              className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
              style={{ backgroundColor: 'var(--color-ember)' }}
            />
          </div>

          <div className="max-w-4xl mx-auto text-center mb-12 relative z-10">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
              style={{ backgroundColor: 'var(--color-bloom)15', color: 'var(--color-bloom)' }}
            >
              <Sparkles className="w-3 h-3" />
              Simple, transparent pricing
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ color: 'var(--color-ink)' }}>
              Pay for what you actually use
            </h1>
            <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              Free gets you started. Pro unlocks cloud storage connectors and syncs your AI chats across every device.
            </p>

            <div
              className="inline-flex p-1 rounded-[var(--radius-lg)] border"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
              {(['monthly', 'yearly'] as BillingCycle[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] transition-all"
                  style={{
                    backgroundColor: cycle === c ? 'var(--color-ink)' : 'transparent',
                    color: cycle === c ? 'var(--color-paper)' : 'var(--color-text-secondary)',
                  }}
                >
                  {c === 'monthly' ? 'Monthly' : 'Yearly'}
                  {c === 'yearly' && (
                    <span
                      className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: cycle === c ? 'var(--color-bloom)' : 'var(--color-bloom)20',
                        color: cycle === c ? 'white' : 'var(--color-bloom)',
                      }}
                    >
                      −25%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="max-w-3xl mx-auto mb-6 p-3 rounded-[var(--radius-md)] text-sm" style={{ backgroundColor: 'var(--color-pulse)15', color: 'var(--color-pulse)' }}>
              {error}
            </div>
          )}

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5 relative z-10">
            {PLANS.map(p => {
              const price = cycle === 'yearly' ? Math.round(p.priceYearly / 12) : p.priceMonthly;
              const isCurrent = plan === p.id;
              return (
                <div
                  key={p.id}
                  className="relative rounded-[var(--radius-xl)] border p-7 transition-all"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: p.popular ? 'var(--color-pulse)' : 'var(--color-border)',
                    boxShadow: p.popular ? 'var(--shadow-2xl)' : 'var(--shadow-sm)',
                    transform: p.popular ? 'scale(1.02)' : 'none',
                  }}
                >
                  {p.popular && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md"
                      style={{ backgroundColor: 'var(--color-pulse)', color: 'white' }}
                    >
                      Most popular
                    </div>
                  )}

                  <div className="mb-4">
                    <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-ink)' }}>{p.name}</h2>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{p.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-bold" style={{ color: 'var(--color-ink)' }}>
                      ${price}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {p.priceMonthly === 0 ? 'forever' : '/mo'}
                    </span>
                  </div>
                  {cycle === 'yearly' && p.priceMonthly > 0 && (
                    <p className="text-[11px] mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
                      ${p.priceYearly} billed yearly (save ${Math.round(p.priceMonthly * 12 * yearlyDiscount)})
                    </p>
                  )}
                  {!(cycle === 'yearly' && p.priceMonthly > 0) && <div className="mb-4" />}

                  <button
                    onClick={() => handleSelect(p.id)}
                    disabled={loadingPlan === p.id || isCurrent}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: p.popular ? 'var(--color-ink)' : 'transparent',
                      color: p.popular ? 'var(--color-paper)' : 'var(--color-ink)',
                      border: p.popular ? '1px solid var(--color-ink)' : '1px solid var(--color-border)',
                    }}
                  >
                    {loadingPlan === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrent ? (
                      <>Current plan</>
                    ) : (
                      <>
                        {p.cta}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <ul className="space-y-2.5">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          {f.included ? (
                            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-bloom)' }} />
                          ) : (
                            <X className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-mist)' }} />
                          )}
                          <span
                            style={{
                              color: f.included ? 'var(--color-ink)' : 'var(--color-text-tertiary)',
                              fontWeight: f.highlight ? 600 : 400,
                            }}
                          >
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ color: 'var(--color-ink)' }}>
                Compare every feature
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Pick the plan that fits your career stage.
              </p>
            </div>

            <div className="rounded-[var(--radius-xl)] border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-paper)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                    <th className="text-left px-5 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Feature</th>
                    {PLANS.map(p => (
                      <th key={p.id} className="px-5 py-3 font-semibold text-center" style={{ color: 'var(--color-ink)' }}>{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <CompareRow
                    label="AI coach messages"
                    values={['50 / month', 'Unlimited', 'Unlimited']}
                  />
                  <CompareRow
                    label="Proof cards"
                    values={['Up to 5', 'Unlimited', 'Unlimited']}
                  />
                  <CompareRow
                    label="Chat history"
                    values={[
                      <span key="f" className="inline-flex items-center gap-1"><HardDrive className="w-3 h-3" /> On device</span>,
                      <span key="p" className="inline-flex items-center gap-1"><Cloud className="w-3 h-3" /> Cloud-synced</span>,
                      <span key="t" className="inline-flex items-center gap-1"><Cloud className="w-3 h-3" /> Cloud-synced</span>,
                    ]}
                  />
                  <CompareRow
                    label="Cloud storage"
                    values={['—', '10 GB', '100 GB']}
                  />
                  <CompareRow
                    label="Connectors (Drive, Dropbox, OneDrive, Notion, GitHub)"
                    values={['—', '✓', '✓']}
                  />
                  <CompareRow
                    label="Portfolio scoring & skill gap reports"
                    values={['—', '✓', '✓']}
                  />
                  <CompareRow
                    label="Team seats"
                    values={['—', '—', 'Up to 25']}
                  />
                  <CompareRow
                    label="Bulk import from LMS / portals"
                    values={['—', '—', '✓']}
                  />
                  <CompareRow
                    label="Support"
                    values={['Community', 'Email', 'Dedicated']}
                  />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-paper)' }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-10 text-center" style={{ color: 'var(--color-ink)' }}>
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {FAQ.map((f, i) => (
                <details
                  key={i}
                  className="group rounded-[var(--radius-lg)] border overflow-hidden"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                >
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
                    <span className="text-sm font-semibold pr-4" style={{ color: 'var(--color-ink)' }}>{f.q}</span>
                    <span
                      className="text-lg transition-transform group-open:rotate-45"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          className="py-16 px-4 sm:px-6 lg:px-8"
          style={{ backgroundColor: 'var(--color-ink)' }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--color-bloom)' }} />
            <h2 className="text-3xl font-bold tracking-tight mb-3 text-white">
              You own your data. Always.
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-mist)' }}>
              OAuth is read-only by default. We never write to your cloud accounts. Disconnect at any time to revoke access instantly.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] text-sm font-semibold transition-all"
              style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
            >
              Start free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

function CompareRow({ label, values }: { label: string; values: (string | React.ReactNode)[] }) {
  return (
    <tr className="border-t" style={{ borderColor: 'var(--color-border)' }}>
      <td className="px-5 py-3 font-medium" style={{ color: 'var(--color-ink)' }}>{label}</td>
      {values.map((v, i) => (
        <td key={i} className="px-5 py-3 text-center" style={{ color: 'var(--color-text-secondary)' }}>
          {v}
        </td>
      ))}
    </tr>
  );
}

const FAQ = [
  {
    q: 'What does "free" actually mean?',
    a: 'You can use Orin free forever. You get up to 5 proof cards, 50 AI coach messages per month, and your past chats are saved on this device. Upgrade to Pro to sync your chats across devices and unlock cloud storage connectors.',
  },
  {
    q: 'How does Pro pricing work?',
    a: 'Pro is $12/month billed monthly, or $108/year (save 25%). You can cancel anytime. When you cancel, you keep your data and fall back to the free tier — nothing is deleted.',
  },
  {
    q: 'What are cloud storage connectors?',
    a: 'With Pro, you can connect your Google Drive, Dropbox, OneDrive, Notion, and GitHub accounts. Orin imports files, repos, and pages read-only, extracts skills and projects, and turns them into verified proof cards. We never write to your accounts.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. We use OAuth read-only access for connectors. Imported files are parsed and the originals are discarded. You can disconnect at any time. We never sell your data.',
  },
  {
    q: 'Can I switch from monthly to yearly later?',
    a: 'Yes. You can switch billing cycles anytime from Settings → Billing. Annual saves you 25% compared to monthly billing.',
  },
  {
    q: 'What is Team?',
    a: 'Team is for career services offices, student clubs, and bootcamps. It includes up to 25 student seats, shared coach notes, bulk import from your LMS, and a custom-branded portfolio template.',
  },
];
