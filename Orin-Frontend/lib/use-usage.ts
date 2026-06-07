'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePlan } from './plan-context';
import { useAuth } from './auth-context';
import {
  PLAN_LIMITS,
  USAGE_LABELS,
  type UsageMetric,
  type UsageRecord,
} from './chat-types';

const STORAGE_KEY_PREFIX = 'orin.usage.v1.';
const STORAGE_KEY_LEGACY = 'orin.usage.v1';

const PERIOD_DAYS: Partial<Record<UsageMetric, number>> = {
  ai_messages: 30,
  portfolio_scores: 30,
  opportunity_matches: 30,
  cover_letters: 30,
};

function getPeriodStart(metric: UsageMetric): Date {
  const days = PERIOD_DAYS[metric] ?? 0;
  if (!days) {
    return new Date(0);
  }
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getPeriodEnd(metric: UsageMetric): Date {
  const days = PERIOD_DAYS[metric] ?? 0;
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  if (days > 0) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

interface LocalUsage {
  [metric: string]: UsageRecord;
}

function storageKey(userId: string) {
  return userId ? STORAGE_KEY_PREFIX + userId : STORAGE_KEY_LEGACY;
}

function readUsage(userId: string): LocalUsage {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as LocalUsage) : {};
  } catch {
    return {};
  }
}

function writeUsage(userId: string, data: LocalUsage) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch {}
}

function getOrInitRecord(userId: string, metric: UsageMetric): UsageRecord {
  const all = readUsage(userId);
  const existing = all[metric];
  const periodStart = getPeriodStart(metric).toISOString();
  const resetAt = getPeriodEnd(metric).toISOString();

  if (existing && existing.periodStart === periodStart) {
    return existing;
  }
  return {
    metric,
    count: 0,
    periodStart,
    resetAt,
  };
}

export interface LimitInfo {
  metric: UsageMetric;
  used: number;
  limit: number;
  remaining: number;
  percent: number;
  isUnlimited: boolean;
  isExhausted: boolean;
  resetsAt?: string;
  name: string;
  noun: string;
  period: string;
  plan: 'free' | 'pro' | 'team';
}

export interface UseUsageResult {
  get: (metric: UsageMetric) => LimitInfo;
  record: (metric: UsageMetric, n?: number) => LimitInfo;
  canUse: (metric: UsageMetric) => boolean;
  isExhausted: (metric: UsageMetric) => boolean;
  reset: () => void;
  refresh: () => void;
}

export function useUsage(): UseUsageResult {
  const { plan, isPro, isTeam } = usePlan();
  const { user } = useAuth();
  const userId = user?.id || 'anon';
  const [, setVersion] = useState(0);

  useEffect(() => {
    setVersion(v => v + 1);
  }, [userId, plan]);

  const get = useCallback(
    (metric: UsageMetric): LimitInfo => {
      const limit = PLAN_LIMITS[plan][metric];
      const record = getOrInitRecord(userId, metric);
      const used = record.count;
      const isUnlimited = !Number.isFinite(limit);
      const isExhausted = !isUnlimited && used >= limit;
      const remaining = isUnlimited ? Infinity : Math.max(0, limit - used);
      const percent = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
      const meta = USAGE_LABELS[metric];

      return {
        metric,
        used,
        limit,
        remaining,
        percent,
        isUnlimited,
        isExhausted,
        resetsAt: record.resetAt,
        name: meta.name,
        noun: meta.noun,
        period: meta.period,
        plan,
      };
    },
    [plan, userId],
  );

  const record = useCallback(
    (metric: UsageMetric, n: number = 1): LimitInfo => {
      const all = readUsage(userId);
      const record = getOrInitRecord(userId, metric);
      record.count += n;
      all[metric] = record;
      writeUsage(userId, all);
      setVersion(v => v + 1);
      return get(metric);
    },
    [userId, get],
  );

  const canUse = useCallback(
    (metric: UsageMetric) => {
      const info = get(metric);
      if (info.isUnlimited) return true;
      return !info.isExhausted || isPro || isTeam;
    },
    [get, isPro, isTeam],
  );

  const isExhausted = useCallback(
    (metric: UsageMetric) => get(metric).isExhausted,
    [get],
  );

  const reset = useCallback(() => {
    writeUsage(userId, {});
    setVersion(v => v + 1);
  }, [userId]);

  const refresh = useCallback(() => {
    setVersion(v => v + 1);
  }, []);

  return useMemo(
    () => ({ get, record, canUse, isExhausted, reset, refresh }),
    [get, record, canUse, isExhausted, reset, refresh],
  );
}

export function formatTimeUntilReset(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'now';
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
