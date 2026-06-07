'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  HardDrive,
  Github,
  Check,
  X,
  RefreshCw,
  FileText,
  ExternalLink,
  Sparkles,
  Lock,
  Loader2,
  CloudOff,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePlan } from '@/lib/plan-context';
import { api } from '@/lib/api-client';
import { CLOUD_PROVIDERS, type CloudProvider, type UserIntegration } from '@/lib/chat-types';


const ICON_MAP: Record<string, any> = { Cloud, HardDrive, Github, FileText };

const CATEGORY_LABELS = {
  storage: 'Cloud Storage',
  productivity: 'Productivity',
  code: 'Code',
};

const STORAGE_KEY = 'orin.integrations.v1';

function readLocalIntegrations(userId: string): UserIntegration[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY}.${userId}`);
    return raw ? (JSON.parse(raw) as UserIntegration[]) : [];
  } catch {
    return [];
  }
}

function writeLocalIntegrations(userId: string, list: UserIntegration[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${STORAGE_KEY}.${userId}`, JSON.stringify(list));
  } catch {}
}

export default function IntegrationsPage() {
  const { user } = useAuth();
  const { plan, planDef, isFree, isPro } = usePlan();
  const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [imported, setImported] = useState<Record<string, Array<{ name: string; type: string }>>>({});

  const userId = user?.id || 'anon';

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const list = await api.integrations.list();
      if (Array.isArray(list)) {
        setIntegrations(list as UserIntegration[]);
        return;
      }
    } catch {}
    setIntegrations(readLocalIntegrations(userId));
  }, [user, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const getIntegration = (providerId: string) =>
    integrations.find(i => i.providerId === providerId);

  const handleConnect = useCallback(
    async (provider: CloudProvider) => {
      if (isFree && !provider.freeSupported) {
        return;
      }
      setLoadingId(provider.id);
      try {
        try {
          const res = await api.integrations.connect(provider.id);
          if (res?.authUrl) {
            window.open(res.authUrl, '_blank', 'noopener,noreferrer');
          }
        } catch {}

        await new Promise(r => setTimeout(r, 600));

        const now = new Date().toISOString();
        const newIntegration: UserIntegration = {
          id: `int_${Date.now()}`,
          userId,
          providerId: provider.id,
          status: 'connected',
          accountEmail: user?.email || 'you@example.com',
          accountName: user?.email?.split('@')[0] || 'You',
          filesImported: 0,
          lastSyncedAt: now,
          createdAt: now,
          updatedAt: now,
        };
        const next = [
          ...integrations.filter(i => i.providerId !== provider.id),
          newIntegration,
        ];
        setIntegrations(next);
        writeLocalIntegrations(userId, next);
      } finally {
        setLoadingId(null);
      }
    },
    [isFree, integrations, user, userId],
  );

  const handleDisconnect = useCallback(
    async (providerId: string) => {
      setLoadingId(providerId);
      try {
        try {
          await api.integrations.disconnect(providerId);
        } catch {}
        const next = integrations.filter(i => i.providerId !== providerId);
        setIntegrations(next);
        writeLocalIntegrations(userId, next);
        setImported(prev => {
          const { [providerId]: _, ...rest } = prev;
          return rest;
        });
      } finally {
        setLoadingId(null);
      }
    },
    [integrations, userId],
  );

  const handleSync = useCallback(
    async (providerId: string) => {
      setSyncingId(providerId);
      try {
        await new Promise(r => setTimeout(r, 1200));
        const next = integrations.map(i =>
          i.providerId === providerId
            ? { ...i, lastSyncedAt: new Date().toISOString() }
            : i,
        );
        setIntegrations(next);
        writeLocalIntegrations(userId, next);
      } finally {
        setSyncingId(null);
      }
    },
    [integrations, userId],
  );

  const handleImport = useCallback(
    async (provider: CloudProvider) => {
      setImportingId(provider.id);
      try {
        const mockFiles: Record<string, Array<{ name: string; type: string }>> = {
          google_drive: [
            { name: 'Capstone Report.pdf', type: 'document' },
            { name: 'Project Screenshots/', type: 'folder' },
            { name: 'Final Presentation.pptx', type: 'presentation' },
          ],
          dropbox: [
            { name: 'Portfolio-2026.pdf', type: 'document' },
            { name: 'design-mockups.fig', type: 'design' },
          ],
          onedrive: [
            { name: 'Resume.docx', type: 'document' },
            { name: 'Hackathon-Writeup.docx', type: 'document' },
          ],
          notion: [
            { name: 'Project Roadmap', type: 'page' },
            { name: 'Meeting Notes', type: 'page' },
          ],
          github: [
            { name: 'orin-backend (repo)', type: 'repo' },
            { name: 'ml-experiments (repo)', type: 'repo' },
          ],
        };

        await new Promise(r => setTimeout(r, 1500));
        const files = mockFiles[provider.id] || [];
        setImported(prev => ({ ...prev, [provider.id]: files }));

        const next = integrations.map(i =>
          i.providerId === provider.id
            ? { ...i, filesImported: (i.filesImported || 0) + files.length, lastSyncedAt: new Date().toISOString() }
            : i,
        );
        setIntegrations(next);
        writeLocalIntegrations(userId, next);
      } finally {
        setImportingId(null);
      }
    },
    [integrations, userId],
  );

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-bloom)' }} />
      </div>
    );
  }

  const connectedCount = integrations.filter(i => i.status === 'connected').length;

  return (
    <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--color-ink)' }}>
              Cloud Connectors
            </h1>
            {isPro && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: 'var(--color-bloom)15', color: 'var(--color-bloom)' }}
              >
                <Sparkles className="w-3 h-3" />
                Pro
              </span>
            )}
          </div>
          <p className="text-base max-w-2xl" style={{ color: 'var(--color-text-secondary)' }}>
            Import work from the tools you already use. Orin turns docs, repos, and notes into verified career proof.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <StatCard
            label="Connected"
            value={`${connectedCount} / ${CLOUD_PROVIDERS.length}`}
            icon={Cloud}
            tone="bloom"
          />
          <StatCard
            label="Storage"
            value={planDef.storage.storageGB === 'unlimited' ? '100 GB' : `${planDef.storage.storageGB} GB`}
            icon={HardDrive}
            tone="pulse"
          />
          <StatCard
            label="Plan"
            value={planDef.name}
            icon={isPro ? Sparkles : Lock}
            tone="ember"
          />
        </div>

        {isFree && (
          <div
            className="mb-8 p-5 rounded-[var(--radius-xl)] border flex flex-col sm:flex-row items-start sm:items-center gap-4"
            style={{
              borderColor: 'var(--color-bloom)30',
              backgroundColor: 'var(--color-bloom)08',
            }}
          >
            <div
              className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-bloom)15' }}
            >
              <Lock className="w-5 h-5" style={{ color: 'var(--color-bloom)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                Cloud connectors are a Pro feature
              </p>
             <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Upgrade to import work from Drive, Dropbox, OneDrive, Notion, and GitHub — and sync your chat history across devices.
              </p>
            </div>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
            >
              See Pro
            </Link>
          </div>
        )}

        {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map(category => {
          const providers = CLOUD_PROVIDERS.filter(p => p.category === category);
          return (
            <section key={category} className="mb-10">
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-ink)' }}>
                {CATEGORY_LABELS[category]}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map(provider => {
                  const Icon = ICON_MAP[provider.icon] || Cloud;
                  const integration = getIntegration(provider.id);
                  const isConnected = integration?.status === 'connected';
                  const isLoading = loadingId === provider.id;
                  const isSyncing = syncingId === provider.id;
                  const isImporting = importingId === provider.id;
                  const isLocked = isFree && !provider.freeSupported;
                  const importedFiles = imported[provider.id] || [];

                  return (
                    <div
                      key={provider.id}
                      className="relative rounded-[var(--radius-xl)] border p-5 transition-all"
                      style={{
                        borderColor: isConnected ? provider.brandColor + '40' : 'var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        boxShadow: isConnected ? `0 4px 16px ${provider.brandColor}10` : 'none',
                      }}
                    >
                      {isLocked && (
                        <div className="absolute top-3 right-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                            style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
                          >
                            <Lock className="w-2.5 h-2.5" />
                            Pro
                          </span>
                        </div>
                      )}

                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-11 h-11 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: provider.brandColor + '15' }}
                        >
                          <Icon className="w-5 h-5" style={{ color: provider.brandColor }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                            {provider.name}
                          </h3>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                            {provider.description}
                          </p>
                        </div>
                      </div>

                      {isConnected && integration && (
                        <div className="mb-3 p-2.5 rounded-[var(--radius-md)] text-xs" style={{ backgroundColor: provider.brandColor + '08' }}>
                          <div className="flex items-center gap-1.5 font-semibold mb-1" style={{ color: provider.brandColor }}>
                            <Check className="w-3 h-3" />
                            Connected as {integration.accountName}
                          </div>
                          <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                            <span>{integration.filesImported || 0} files imported</span>
                            {integration.lastSyncedAt && (
                              <span>Last synced {new Date(integration.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {isConnected && importedFiles.length > 0 && (
                        <div className="mb-3 space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                            Last import
                          </p>
                          {importedFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <FileText className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                              <span className="truncate" style={{ color: 'var(--color-ink)' }}>{f.name}</span>
                              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-tertiary)' }}>
                                {f.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {!isConnected ? (
                          <button
                            onClick={() => handleConnect(provider)}
                            disabled={isLoading || isLocked}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: isLocked ? 'var(--color-surface-dim)' : provider.brandColor,
                              color: isLocked ? 'var(--color-text-tertiary)' : 'white',
                            }}
                          >
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                            {isLocked ? 'Pro only' : 'Connect'}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleImport(provider)}
                              disabled={isImporting}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all hover:opacity-90"
                              style={{ backgroundColor: provider.brandColor, color: 'white' }}
                            >
                              {isImporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                              Import
                            </button>
                            <button
                              onClick={() => handleSync(provider.id)}
                              disabled={isSyncing}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all border"
                              style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                            >
                              {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                              Sync
                            </button>
                            <button
                              onClick={() => handleDisconnect(provider.id)}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all hover:bg-[var(--color-pulse)10]"
                              style={{ color: 'var(--color-pulse)' }}
                            >
                              <CloudOff className="w-3 h-3" />
                              Disconnect
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div
          className="mt-12 p-6 rounded-[var(--radius-xl)] border"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface-dim)',
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-bloom)' }} />
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                How your data is handled
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                We use OAuth read-only access by default. We never write back to your cloud accounts.
                Imported files are parsed locally to extract skills, then the original file is discarded.
                You can disconnect at any time to revoke our access.
              </p>
            </div>
          </div>
        </div>
      </main>
  );
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: 'bloom' | 'pulse' | 'ember' }) {
  return (
    <div
      className="p-4 rounded-[var(--radius-lg)] border"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: `var(--color-${tone})` }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          {label}
        </span>
      </div>
      <p className="text-xl font-bold" style={{ color: 'var(--color-ink)' }}>{value}</p>
    </div>
  );
}
