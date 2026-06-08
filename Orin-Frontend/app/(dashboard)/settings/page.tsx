'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Database } from '@/lib/supabase';
import {
  User,
  Bell,
  Shield,
  Plug,
  CreditCard,
  AlertTriangle,
  Camera,
  Copy,
  Check,
  Download,
  ExternalLink,
  Loader2,
  X,
  RefreshCw,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

function GithubIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function TwitterIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GlobeIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KaggleIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.281.18.046.149.034.233-.036.315L12.1 15.271l6.689 8.275c.07.093.092.186.036.313z" />
    </svg>
  );
}

type Section = 'account' | 'notifications' | 'privacy' | 'integrations' | 'billing';

function Toggle({ enabled, onToggle, id, saving }: { enabled: boolean; onToggle: () => void; id: string; saving?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {saving && <Loader2 className="h-3 w-3 animate-spin" style={{ color: 'var(--color-text-tertiary)' }} />}
      <button
        id={id}
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        disabled={saving}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bloom)] focus-visible:ring-offset-2 disabled:opacity-60"
        style={{ backgroundColor: enabled ? 'var(--color-bloom)' : 'var(--color-border-strong)' }}
      >
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'account', label: 'Account', icon: <User size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { id: 'privacy', label: 'Privacy', icon: <Shield size={18} /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug size={18} /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard size={18} /> },
];

const inputClass = "w-full rounded-xl border bg-[var(--color-surface)] px-4 py-3 text-sm transition placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20";

const INTEGRATION_PROVIDERS = [
  { id: 'github', label: 'GitHub', icon: <GithubIcon size={20} />, description: 'Repositories, contributions, and commit history' },
  { id: 'linkedin', label: 'LinkedIn', icon: <LinkedinIcon size={20} />, description: 'Professional network and experience' },
  { id: 'google', label: 'Google', icon: <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>, description: 'Google account and services' },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('account');
  const [loading, setLoading] = useState(true);
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notifs, setNotifs] = useState({
    weeklySummary: true,
    recruiterViews: true,
    verificationStatus: false,
    opportunityMatch: true,
    coachTips: false,
    productUpdates: true,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  const [profilePublic, setProfilePublic] = useState(true);
  const [hideEmail, setHideEmail] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [subscription, setSubscription] = useState({ plan: 'free' as string, status: 'active' as string });

  const [integrations, setIntegrations] = useState<Array<{
    provider: string;
    label: string;
    icon: React.ReactNode;
    connected: boolean;
    lastSync: string | null;
    integrationId: string | null;
  }>>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      if (!supabase) { setLoading(false); return; }
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/signin'); return; }
      const { data: userData } = await supabase.from('users').select('*').eq('auth_user_id', authUser.id).maybeSingle();
      if (userData) {
        setDbUserId(userData.id);
        setFullName(userData.full_name || '');
        setHeadline(userData.headline || '');
        setLocation(userData.location || '');
        setUsername(userData.username || '');
        setBio(userData.bio || '');
        setWebsiteUrl(userData.website_url || '');
        setGithubUrl(userData.github_url || '');
        setLinkedinUrl(userData.linkedin_url || '');
        setTwitterUrl(userData.twitter_url || '');
        setProfilePublic(userData.is_profile_public);
        setHideEmail(userData.hide_email);

        const { data: notifData } = await supabase.from('notification_preferences').select('*').eq('user_id', userData.id).maybeSingle();
        if (notifData) {
          setNotifs({
            weeklySummary: notifData.weekly_summary,
            recruiterViews: notifData.recruiter_views,
            verificationStatus: notifData.verification_changes,
            opportunityMatch: notifData.opportunity_matches,
            coachTips: notifData.coach_tips,
            productUpdates: notifData.product_updates,
          });
        }

        const { data: subData } = await supabase.from('subscriptions').select('plan, status').eq('user_id', userData.id).is('deleted_at', null).maybeSingle();
        if (subData) setSubscription({ plan: subData.plan, status: subData.status });

        const { data: intData } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', userData.id)
          .is('deleted_at', null);

        const connectedIntegrations = (intData || []).map(int => {
          const provider = INTEGRATION_PROVIDERS.find(p => p.id === int.provider);
          return {
            provider: int.provider,
            label: provider?.label || int.provider,
            icon: provider?.icon || <Plug size={20} />,
            connected: int.status === 'connected',
            lastSync: int.last_synced_at ? formatRelativeTime(new Date(int.last_synced_at)) : null,
            integrationId: int.id,
          };
        });

        const unconnected = INTEGRATION_PROVIDERS
          .filter(p => !connectedIntegrations.some(ci => ci.provider === p.id))
          .map(p => ({
            provider: p.id,
            label: p.label,
            icon: p.icon,
            connected: false,
            lastSync: null,
            integrationId: null,
          }));

        setIntegrations([...connectedIntegrations, ...unconnected]);
      }
      setLoading(false);
    };
    fetchAll();
  }, [router]);

  const saveToDb = useCallback(async (updates: {
    full_name?: string;
    headline?: string;
    location?: string;
    username?: string;
    bio?: string;
    website_url?: string;
    github_url?: string;
    linkedin_url?: string;
    twitter_url?: string;
    is_profile_public?: boolean;
    hide_email?: boolean;
  }) => {
    if (!supabase) return;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { error } = await supabase.from('users').update(updates).eq('auth_user_id', authUser.id);
    if (error) throw error;
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      await saveToDb({
        full_name: fullName || undefined,
        headline: headline || undefined,
        location: location || undefined,
        username: username || undefined,
        bio: bio || undefined,
        website_url: websiteUrl || undefined,
        github_url: githubUrl || undefined,
        linkedin_url: linkedinUrl || undefined,
        twitter_url: twitterUrl || undefined,
        is_profile_public: profilePublic,
        hide_email: hideEmail,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { setSaved(false); } finally { setSaving(false); }
  }, [fullName, headline, location, username, bio, websiteUrl, githubUrl, linkedinUrl, twitterUrl, profilePublic, hideEmail, saveToDb]);

  const savePrivacySetting = useCallback(async (field: 'is_profile_public' | 'hide_email', value: boolean) => {
    setPrivacySaving(true);
    try {
      await saveToDb({ [field]: value });
    } catch (e) {
      console.error('Failed to save privacy setting:', e);
    } finally {
      setPrivacySaving(false);
    }
  }, [saveToDb]);

  const handleNotifSave = async (key: keyof typeof notifs) => {
    setNotifSaving(true);
    try {
      if (supabase && dbUserId) {
        const dbKey = key === 'weeklySummary' ? 'weekly_summary' : key === 'recruiterViews' ? 'recruiter_views' : key === 'verificationStatus' ? 'verification_changes' : key === 'opportunityMatch' ? 'opportunity_matches' : key === 'coachTips' ? 'coach_tips' : 'product_updates';
        await supabase.from('notification_preferences').upsert({ user_id: dbUserId, [dbKey]: notifs[key] } as Database['public']['Tables']['notification_preferences']['Insert'], { onConflict: 'user_id' });
      }
    } catch {} finally { setNotifSaving(false); }
  };

  const handleConnectIntegration = async (provider: string) => {
    if (!supabase || !dbUserId) return;
    try {
      const { error } = await supabase
        .from('user_integrations')
        .upsert({
          user_id: dbUserId,
          provider: provider as Database['public']['Tables']['user_integrations']['Insert']['provider'],
          status: 'connected',
          last_synced_at: new Date().toISOString(),
        }, { onConflict: 'user_id,provider' });

      if (error) throw error;

      setIntegrations(prev => prev.map(int =>
        int.provider === provider
          ? { ...int, connected: true, lastSync: 'just now' }
          : int
      ));
    } catch (e) {
      console.error('Failed to connect integration:', e);
    }
  };

  const handleDisconnectIntegration = async (provider: string) => {
    if (!supabase || !dbUserId) return;
    try {
      const { error } = await supabase
        .from('user_integrations')
        .update({ status: 'disconnected', deleted_at: new Date().toISOString() })
        .eq('user_id', dbUserId)
        .eq('provider', provider as Database['public']['Tables']['user_integrations']['Row']['provider']);

      if (error) throw error;

      setIntegrations(prev => prev.map(int =>
        int.provider === provider
          ? { ...int, connected: false, lastSync: null }
          : int
      ));
    } catch (e) {
      console.error('Failed to disconnect integration:', e);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      if (supabase) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await supabase.from('users').update({ deleted_at: new Date().toISOString() }).eq('auth_user_id', authUser.id);
          await supabase.auth.signOut();
        }
      }
      router.push('/');
    } catch { setDeleting(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://orin.app/${username || 'yourname'}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = fullName ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const toggleNotif = (key: keyof typeof notifs) => {
    setNotifs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (supabase && dbUserId) {
        const dbKey = key === 'weeklySummary' ? 'weekly_summary' : key === 'recruiterViews' ? 'recruiter_views' : key === 'verificationStatus' ? 'verification_changes' : key === 'opportunityMatch' ? 'opportunity_matches' : key === 'coachTips' ? 'coach_tips' : 'product_updates';
        void supabase.from('notification_preferences').upsert({ user_id: dbUserId, [dbKey]: next[key] } as Database['public']['Tables']['notification_preferences']['Insert'], { onConflict: 'user_id' });
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-bloom)' }} />
      </div>
    );
  }

  const renderAccount = () => (
    <div className="space-y-6">
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Profile photo</h2>
        <div className="mt-4 flex items-center gap-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--color-bloom), var(--color-ember))' }}>
              {initials}
            </div>
            <button type="button" aria-label="Upload photo" className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-sm transition hover:scale-110" style={{ backgroundColor: 'var(--color-surface)' }}>
              <Camera size={14} style={{ color: 'var(--color-text-tertiary)' }} />
            </button>
          </div>
          <div>
            <button type="button" className="btn-outline px-4 py-2 text-sm">
              Upload new photo
            </button>
            <p className="mt-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>JPG, PNG or GIF. Max 2 MB.</p>
          </div>
        </div>
      </div>

      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Personal information</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Full name</label>
            <input id="fullName" type="text" placeholder="Aditi Gupta" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} style={{ borderColor: 'var(--color-border)' }} />
          </div>
          <div>
            <label htmlFor="headline" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Headline</label>
            <input id="headline" type="text" placeholder="Frontend engineer · Builder" value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputClass} style={{ borderColor: 'var(--color-border)' }} />
          </div>
          <div>
            <label htmlFor="location" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Location</label>
            <input id="location" type="text" placeholder="Bengaluru, India" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} style={{ borderColor: 'var(--color-border)' }} />
          </div>
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Username / slug</label>
            <div className="flex items-center rounded-xl border transition focus-within:ring-2 focus-within:ring-[var(--color-bloom)]/20" style={{ borderColor: 'var(--color-border)' }}>
              <span className="pl-3.5 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>orin.app/</span>
              <input id="username" type="text" placeholder="aditi" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border-0 bg-transparent px-1 py-3 text-sm placeholder:text-[var(--color-text-tertiary)] focus:outline-none" style={{ color: 'var(--color-ink)' }} />
            </div>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="bio" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Bio</label>
            <textarea id="bio" rows={3} placeholder="Write a short bio about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} className={`${inputClass} resize-none`} style={{ borderColor: 'var(--color-border)' }} />
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{bio.length}/280 characters</p>
          </div>
        </div>

        <h3 className="mt-6 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Social links</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="websiteUrl" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              <GlobeIcon size={14} /> Website
            </label>
            <input id="websiteUrl" type="url" placeholder="https://yoursite.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={inputClass} style={{ borderColor: 'var(--color-border)' }} />
          </div>
          <div>
            <label htmlFor="githubUrl" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              <GithubIcon size={14} /> GitHub
            </label>
            <input id="githubUrl" type="url" placeholder="https://github.com/username" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className={inputClass} style={{ borderColor: 'var(--color-border)' }} />
          </div>
          <div>
            <label htmlFor="linkedinUrl" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              <LinkedinIcon size={14} /> LinkedIn
            </label>
            <input id="linkedinUrl" type="url" placeholder="https://linkedin.com/in/username" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className={inputClass} style={{ borderColor: 'var(--color-border)' }} />
          </div>
          <div>
            <label htmlFor="twitterUrl" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              <TwitterIcon size={14} /> Twitter / X
            </label>
            <input id="twitterUrl" type="url" placeholder="https://x.com/username" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} className={inputClass} style={{ borderColor: 'var(--color-border)' }} />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button className="btn-success inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : saved ? <><Check size={16} /> Saved!</> : 'Save changes'}
          </button>
          {saved && <span className="text-sm font-medium" style={{ color: 'var(--color-bloom)' }}>Changes saved successfully</span>}
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => {
    const items: { key: keyof typeof notifs; label: string; desc: string }[] = [
      { key: 'weeklySummary', label: 'Weekly proof summary', desc: 'Receive a digest of your proof activity every Monday' },
      { key: 'recruiterViews', label: 'New recruiter view alerts', desc: 'Get notified when a recruiter views your profile' },
      { key: 'verificationStatus', label: 'Verification status updates', desc: 'Updates when your proof cards are verified or need attention' },
      { key: 'opportunityMatch', label: 'Opportunity match alerts', desc: 'Be alerted when new roles match your proof profile' },
      { key: 'coachTips', label: 'Coach tip notifications', desc: 'Personalized tips on improving your career proof' },
      { key: 'productUpdates', label: 'Product updates', desc: 'New features and improvements to Orin' },
    ];

    return (
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Email notifications</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Choose when ORIN should reach you. Changes are saved automatically.</p>
        <div className="mt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
          {items.map((item, i) => (
            <div key={item.key} className="flex items-center justify-between py-4" style={{ borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <div className="pr-4">
                <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{item.label}</p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{item.desc}</p>
              </div>
              <Toggle id={`toggle-${item.key}`} enabled={notifs[item.key]} onToggle={() => toggleNotif(item.key)} />
            </div>
          ))}
        </div>
        {notifSaving && (
          <p className="mt-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Saving...</p>
        )}
      </div>
    );
  };

  const renderPrivacy = () => (
    <div className="space-y-6">
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Profile visibility</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Control who can see your profile and proof cards. Changes save automatically.</p>
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Public profile</p>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{profilePublic ? 'Anyone with the link can view your profile' : 'Only you can see your profile'}</p>
            </div>
            <Toggle
              id="toggle-profile-public"
              enabled={profilePublic}
              saving={privacySaving}
              onToggle={() => {
                const next = !profilePublic;
                setProfilePublic(next);
                savePrivacySetting('is_profile_public', next);
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Hide email</p>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Your email won&apos;t be visible on your public profile</p>
            </div>
            <Toggle
              id="toggle-hide-email"
              enabled={hideEmail}
              saving={privacySaving}
              onToggle={() => {
                const next = !hideEmail;
                setHideEmail(next);
                savePrivacySetting('hide_email', next);
              }}
            />
          </div>
        </div>
      </div>

      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Public profile link</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Share this link so others can view your career proof.</p>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-xl border px-4 py-2.5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-dim)' }}>
            <span className="truncate text-sm" style={{ color: 'var(--color-ink)' }}>https://orin.app/{username || 'yourname'}</span>
          </div>
          <button type="button" onClick={handleCopy} className="btn-outline inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Your data</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Export all your proof data as a JSON file.</p>
        <button
          type="button"
          onClick={async () => {
            if (!supabase || !dbUserId) return;
            const { data: proofs } = await supabase.from('proof_cards').select('*').eq('user_id', dbUserId).is('deleted_at', null);
            const blob = new Blob([JSON.stringify(proofs || [], null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orin-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="btn-outline mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
        >
          <Download size={16} />
          Export data
        </button>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="card-premium p-6">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Connected services</h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Connect platforms to automatically import your proof of work.</p>
      <div className="mt-6">
        {integrations.map((int, i) => (
          <div key={int.provider} className="flex items-center justify-between py-4" style={{ borderBottom: i < integrations.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-ink)' }}>
                {int.icon}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{int.label}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: int.connected ? 'var(--color-bloom)' : 'var(--color-text-tertiary)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {int.connected ? `Connected${int.lastSync ? ` · Synced ${int.lastSync}` : ''}` : 'Not connected'}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => int.connected ? handleDisconnectIntegration(int.provider) : handleConnectIntegration(int.provider)}
              className="rounded-xl border px-4 py-2 text-sm font-medium transition"
              style={{
                borderColor: int.connected ? 'var(--color-border)' : 'var(--color-bloom)',
                color: int.connected ? 'var(--color-text-tertiary)' : 'var(--color-bloom)',
                backgroundColor: int.connected ? 'transparent' : 'var(--color-bloom)08',
              }}
            >
              {int.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="card-premium p-6">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Plan & billing</h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Manage your subscription and payment details.</p>
      <div className="mt-6 rounded-xl p-5" style={{ border: '1px solid var(--color-bloom)20', backgroundColor: 'var(--color-bloom)06' }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-block rounded-full px-3 py-0.5 text-xs font-semibold text-white capitalize" style={{ backgroundColor: 'var(--color-bloom)' }}>
              {subscription.plan} Plan
            </span>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-ink)' }}>
              {subscription.plan === 'free'
                ? "You're on the free tier. Upgrade to unlock unlimited proof cards, analytics, and priority verification."
                : `Your ${subscription.plan} plan is ${subscription.status}.`}
            </p>
            {subscription.plan !== 'free' && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Status: {subscription.status}
              </p>
            )}
          </div>
        </div>
        {subscription.plan === 'free' && (
          <button type="button" className="btn-success mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white">
            Upgrade plan
          </button>
        )}
      </div>
    </div>
  );

  const sectionRenderers: Record<Section, () => React.ReactNode> = {
    account: renderAccount,
    notifications: renderNotifications,
    privacy: renderPrivacy,
    integrations: renderIntegrations,
    billing: renderBilling,
  };

  const sectionTitles: Record<Section, { title: string; subtitle: string }> = {
    account: { title: 'Account settings', subtitle: 'Control how your profile appears and how ORIN communicates with you.' },
    notifications: { title: 'Notification preferences', subtitle: 'Choose when and how ORIN should reach you.' },
    privacy: { title: 'Privacy & data', subtitle: 'Control your profile visibility and manage your data.' },
    integrations: { title: 'Integrations', subtitle: 'Connect external services to import your work automatically.' },
    billing: { title: 'Plan & billing', subtitle: 'Manage your subscription and payment details.' },
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="animate-fadeInLeft">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-tertiary)' }}>Settings</h2>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button key={item.id} type="button" onClick={() => setActiveSection(item.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200" style={{
              backgroundColor: activeSection === item.id ? 'var(--color-bloom)08' : 'transparent',
              color: activeSection === item.id ? 'var(--color-bloom)' : 'var(--color-text-tertiary)',
            }}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="min-w-0 space-y-6 animate-fadeInUp">
        <header>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>{sectionTitles[activeSection].title}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{sectionTitles[activeSection].subtitle}</p>
        </header>

        {sectionRenderers[activeSection]()}

        <div className="card-premium p-6" style={{ border: '1px solid var(--color-pulse)20' }}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-pulse)10' }}>
              <AlertTriangle size={18} style={{ color: 'var(--color-pulse)' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-pulse)' }}>Danger zone</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Deleting your account permanently removes all proof data, analytics, and profile information. This action cannot be undone.</p>
              <button className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white transition" style={{ backgroundColor: 'var(--color-pulse)' }} type="button" onClick={() => setShowDeleteModal(true)}>
                Delete account
              </button>
            </div>
          </div>
        </div>
      </section>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-label="Confirm account deletion" className="relative w-full max-w-md p-6 shadow-2xl" style={{ borderRadius: 'var(--radius-2xl)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }} className="absolute right-4 top-4 transition hover:opacity-70" aria-label="Close dialog">
              <X size={20} style={{ color: 'var(--color-text-tertiary)' }} />
            </button>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-pulse)10' }}>
              <AlertTriangle size={24} style={{ color: 'var(--color-pulse)' }} />
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Delete your account?</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>This action is permanent and cannot be undone. All proof cards, analytics, and profile data will be permanently removed.</p>
            <div className="mt-4">
              <label htmlFor="deleteConfirm" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                Type <span className="font-mono font-bold" style={{ color: 'var(--color-pulse)' }}>DELETE</span> to confirm
              </label>
              <input id="deleteConfirm" type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="DELETE" className={inputClass} style={{ borderColor: 'var(--color-border)' }} />
            </div>
            <div className="mt-6 flex gap-3">
              <button className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: 'var(--color-pulse)' }} type="button" disabled={deleteConfirm !== 'DELETE' || deleting} onClick={handleDeleteAccount}>
                {deleting ? 'Deleting...' : 'Yes, delete my account'}
              </button>
              <button className="btn-outline flex-1 px-4 py-2.5 text-sm font-semibold" type="button" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
