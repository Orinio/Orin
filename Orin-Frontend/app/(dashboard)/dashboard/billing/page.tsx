'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Check,
  ArrowRight,
  ExternalLink,
  Loader2,
  Zap,
  Shield,
  BarChart3,
  Users,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface Subscription {
  plan: string;
  status: string;
  expiresAt: string | null;
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with basic features',
    features: [
      '5 Proof Cards',
      'Basic skill analysis',
      'Public profile',
      'Community access',
    ],
    color: 'var(--color-text-tertiary)',
    icon: Sparkles,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'Everything you need to accelerate your career',
    features: [
      'Unlimited Proof Cards',
      'AI Career Coach',
      'Advanced analytics',
      'Priority verification',
      'Custom profile themes',
      'Export to PDF',
    ],
    color: 'var(--color-bloom)',
    icon: Crown,
    popular: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: '$29',
    period: '/month',
    description: 'For teams and organizations',
    features: [
      'Everything in Pro',
      'Team dashboard',
      'Bulk verification',
      'Custom branding',
      'API access',
      'Priority support',
      'SSO integration',
    ],
    color: 'var(--color-ember)',
    icon: Users,
  },
];

export default function BillingPage() {
  const { user: authUser } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!supabase || !authUser) return;

      try {
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authUser.id)
          .single();

        if (profile) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('plan, status, current_period_end')
            .eq('user_id', profile.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (sub) {
            setSubscription({
              plan: sub.plan || 'free',
              status: sub.status || 'active',
              expiresAt: sub.current_period_end,
            });
          } else {
            setSubscription({ plan: 'free', status: 'active', expiresAt: null });
          }
        }
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
        setSubscription({ plan: 'free', status: 'active', expiresAt: null });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [authUser]);

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch('/api/billing/portal');
      const data = await res.json();

      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (err) {
      console.error('Portal error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-bloom)' }} />
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'free';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <header>
        <h1
          className="text-2xl font-semibold flex items-center gap-3"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
        >
          <Crown className="h-6 w-6" style={{ color: 'var(--color-bloom)' }} />
          Billing & Subscription
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Manage your subscription and billing preferences.
        </p>
      </header>

      {/* Current Plan */}
      {subscription && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
                Current Plan: {PLANS.find((p) => p.id === currentPlan)?.name || 'Free'}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {subscription.status === 'active'
                  ? 'Your subscription is active'
                  : `Status: ${subscription.status}`}
                {subscription.expiresAt &&
                  ` · Renews ${new Date(subscription.expiresAt).toLocaleDateString()}`}
              </p>
            </div>
            {currentPlan !== 'free' && (
              <button
                onClick={handleManageSubscription}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:scale-[1.02]"
                style={{
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-ink)',
                }}
              >
                Manage
                <ExternalLink className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan, index) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          const isUpgrade = PLANS.findIndex((p) => p.id === currentPlan) < index;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative card-premium p-6 flex flex-col"
              style={{
                border: plan.popular
                  ? `2px solid ${plan.color}`
                  : '1px solid var(--color-border)',
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: plan.color }}
                >
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${plan.color}15` }}
                >
                  <Icon className="h-5 w-5" style={{ color: plan.color }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                    {plan.name}
                  </h3>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold" style={{ color: 'var(--color-ink)' }}>
                  {plan.price}
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  {plan.period}
                </span>
              </div>

              <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
                {plan.description}
              </p>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check
                      className="h-4 w-4 shrink-0"
                      style={{ color: plan.color }}
                    />
                    <span style={{ color: 'var(--color-ink)' }}>{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div
                  className="rounded-xl py-2.5 text-center text-sm font-semibold"
                  style={{
                    backgroundColor: `${plan.color}12`,
                    color: plan.color,
                  }}
                >
                  Current Plan
                </div>
              ) : isUpgrade ? (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgrading === plan.id}
                  className="rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-60"
                  style={{ backgroundColor: plan.color }}
                >
                  {upgrading === plan.id ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Upgrade <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgrading === plan.id}
                  className="rounded-xl py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-60"
                  style={{
                    border: `1px solid ${plan.color}`,
                    color: plan.color,
                  }}
                >
                  {upgrading === plan.id ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                    </span>
                  ) : (
                    'Downgrade'
                  )}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
          Why upgrade to Pro?
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
              style={{ backgroundColor: 'var(--color-bloom)15' }}
            >
              <Zap className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                AI Career Coach
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Get personalized career advice powered by advanced AI agents.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
              style={{ backgroundColor: 'var(--color-ember)15' }}
            >
              <BarChart3 className="h-5 w-5" style={{ color: 'var(--color-ember)' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                Advanced Analytics
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Track your career progress with detailed insights and trends.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
              style={{ backgroundColor: 'var(--color-pulse)15' }}
            >
              <Shield className="h-5 w-5" style={{ color: 'var(--color-pulse)' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                Priority Verification
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Get your proof cards verified faster with priority processing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
