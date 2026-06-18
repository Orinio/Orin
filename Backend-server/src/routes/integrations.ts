import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { encryptToken, decryptToken } from '../lib/token-crypto.js';

export const integrationsRouter = Router();

async function resolveUserId(authUserId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  return data?.id || null;
}

async function getDecryptedToken(userId: string, provider: string): Promise<string | null> {
  const { data } = await supabase
    .from('user_integrations')
    .select('access_token')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('status', 'connected')
    .maybeSingle();
  
  if (!data?.access_token) return null;
  return decryptToken(data.access_token);
}

const PROVIDERS: Record<string, { name: string; description: string; authUrl: string }> = {
  github: {
    name: 'GitHub',
    description: 'Connect your GitHub profile to import repositories, contributions, and activity data.',
    authUrl: 'https://github.com/login/oauth/authorize',
  },
  linkedin: {
    name: 'LinkedIn',
    description: 'Import your professional experience, endorsements, and recommendations.',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  },
  behance: {
    name: 'Behance',
    description: 'Showcase your creative projects and design portfolio.',
    authUrl: 'https://www.behance.net/oauth2/authorize',
  },
  dribbble: {
    name: 'Dribbble',
    description: 'Import your design shots and creative work.',
    authUrl: 'https://dribbble.com/oauth/authorize',
  },
  medium: {
    name: 'Medium',
    description: 'Sync your published articles and writing samples.',
    authUrl: 'https://medium.com/m/oauth/authorize',
  },
  google: {
    name: 'Google Scholar',
    description: 'Import your research publications and citations.',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  slack: {
    name: 'Slack',
    description: 'Connect workspace activity and collaboration data.',
    authUrl: 'https://slack.com/oauth/v2/authorize',
  },
  figma: {
    name: 'Figma',
    description: 'Import your design files and collaboration history.',
    authUrl: 'https://www.figma.com/oauth',
  },
};

integrationsRouter.get('/', async (req, res) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }
    const userId = req.internalUserId || await resolveUserId(authUserId);
    if (!userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User profile not found' } });
      return;
    }

    const { data: connections } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId);

    const connectionMap = new Map(
      (connections || []).map((c: any) => [c.provider, c])
    );

    const data = Object.entries(PROVIDERS).map(([id, provider]) => {
      const conn = connectionMap.get(id);
      return {
        id,
        name: provider.name,
        description: provider.description,
        connected: !!conn,
        lastSync: conn?.last_sync || null,
        status: conn?.status || 'disconnected',
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, 'Integrations list error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

integrationsRouter.get('/:provider/connect', async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.user?.id;

    const providerInfo = PROVIDERS[provider];
    if (!providerInfo) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Provider not found' } });
      return;
    }

    const state = Buffer.from(JSON.stringify({ userId, provider })).toString('base64');
    const authUrl = `${providerInfo.authUrl}?client_id=${process.env[`${provider.toUpperCase()}_CLIENT_ID`]}&redirect_uri=${encodeURIComponent(process.env.OAUTH_REDIRECT_URI || 'http://localhost:3001/api/integrations/callback')}&state=${state}&scope=read`;

    res.json({ success: true, data: { authUrl } });
  } catch (err) {
    logger.error({ err }, 'Integration connect error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

async function importGitHubRepos(
  userId: string,
  token: string
): Promise<Array<{ name: string; url: string; proofId?: string }>> {
  const imported: Array<{ name: string; url: string; proofId?: string }> = [];

  const resp = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!resp.ok) {
    logger.error({ status: resp.status }, 'GitHub repos fetch failed');
    return imported;
  }

  const repos = (await resp.json()) as Array<{
    full_name: string;
    html_url: string;
    description: string | null;
    language: string | null;
    topics: string[];
    created_at: string;
    updated_at: string;
    stargazers_count: number;
    forks_count: number;
    default_branch: string;
  }>;

  const { data: existingProofs } = await supabase
    .from('proof_cards')
    .select('source_url')
    .eq('user_id', userId)
    .eq('source_type', 'github');

  const existingUrls = new Set(existingProofs?.map((p) => p.source_url) || []);

  for (const repo of repos) {
    if (existingUrls.has(repo.html_url)) continue;

    const skills: string[] = [];
    if (repo.language) skills.push(repo.language);
    if (repo.topics?.length) skills.push(...repo.topics);

    const { data: proof, error } = await supabase
      .from('proof_cards')
      .insert({
        user_id: userId,
        title: repo.full_name,
        description: repo.description || `GitHub repository: ${repo.full_name}`,
        source_type: 'github',
        source_url: repo.html_url,
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        skills_user_added: skills,
        metadata: {
          imported_from: 'github',
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          topics: repo.topics,
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          default_branch: repo.default_branch,
          imported_at: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (!error && proof) {
      imported.push({ name: repo.full_name, url: repo.html_url, proofId: proof.id });
    }
  }

  logger.info({ count: imported.length }, 'GitHub repos imported');
  return imported;
}

integrationsRouter.delete('/:provider', async (req, res) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }
    const userId = req.internalUserId || await resolveUserId(authUserId);
    if (!userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User profile not found' } });
      return;
    }
    const { provider } = req.params;

    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Integration disconnect error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

integrationsRouter.post('/:provider/import', async (req, res) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }
    const userId = req.internalUserId || await resolveUserId(authUserId);
    if (!userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User profile not found' } });
      return;
    }
    const { provider } = req.params;

    const { data: connection } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (!connection) {
      res.status(400).json({ error: { code: 'NOT_CONNECTED', message: 'Provider not connected' } });
      return;
    }

    await supabase
      .from('user_integrations')
      .update({ last_synced_at: new Date().toISOString(), status: 'syncing' })
      .eq('id', connection.id);

    const token = await getDecryptedToken(userId, provider);
    if (!token) {
      await supabase
        .from('user_integrations')
        .update({ status: 'error' })
        .eq('id', connection.id);
      res.status(400).json({ error: { code: 'NO_TOKEN', message: 'Could not retrieve access token' } });
      return;
    }

    let imported: Array<{ name: string; url: string; proofId?: string }> = [];

    if (provider === 'github') {
      imported = await importGitHubRepos(userId, token);
    }

    await supabase
      .from('user_integrations')
      .update({ status: 'connected', last_synced_at: new Date().toISOString() })
      .eq('id', connection.id);

    res.json({ success: true, data: { imported, count: imported.length } });
  } catch (err) {
    logger.error({ err }, 'Integration import error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

integrationsRouter.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).json({ error: { code: 'MISSING_PARAMS', message: 'Missing code or state parameter' } });
      return;
    }

    let parsedState: { userId: string; provider: string };
    try {
      parsedState = JSON.parse(Buffer.from(state as string, 'base64').toString());
    } catch {
      res.status(400).json({ error: { code: 'INVALID_STATE', message: 'Invalid state parameter' } });
      return;
    }

    const { userId, provider } = parsedState;

    const tokenEnvKey = `${provider.toUpperCase()}_CLIENT_SECRET`;
    const clientIdEnvKey = `${provider.toUpperCase()}_CLIENT_ID`;
    const clientSecret = process.env[tokenEnvKey];
    const clientId = process.env[clientIdEnvKey];

    if (!clientSecret || !clientId) {
      logger.error({ provider }, 'Missing OAuth credentials');
      res.status(500).json({ error: { code: 'CONFIG_ERROR', message: 'OAuth not configured for this provider' } });
      return;
    }

    let accessToken: string;
    let providerUserId: string | null = null;
    let providerUserName: string | null = null;

    if (provider === 'linkedin') {
      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:3001/api/integrations/callback',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
      if (!tokenData.access_token) {
        logger.error({ provider, error: tokenData }, 'Token exchange failed');
        res.status(500).json({ error: { code: 'TOKEN_ERROR', message: 'Failed to exchange code for token' } });
        return;
      }
      accessToken = tokenData.access_token;

      const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userData = await userRes.json() as { sub?: string; name?: string };
      providerUserId = userData.sub || null;
      providerUserName = userData.name || null;
    } else {
      // Generic OAuth: exchange code for token (GitHub-style)
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code as string,
        }),
      });

      const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
      if (!tokenData.access_token) {
        logger.error({ provider, error: tokenData }, 'Token exchange failed');
        res.status(500).json({ error: { code: 'TOKEN_ERROR', message: 'Failed to exchange code for token' } });
        return;
      }
      accessToken = tokenData.access_token;

      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
      });
      const userData = await userRes.json() as { id?: number; login?: string };
      providerUserId = userData.id?.toString() || null;
      providerUserName = userData.login || null;
    }

    const { error } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: userId,
        provider,
        access_token: encryptToken(accessToken),
        external_user_id: providerUserId,
        external_username: providerUserName,
        status: 'connected',
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'user_id,provider' });

    if (error) {
      logger.error({ provider, error }, 'Failed to save integration');
      res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
      return;
    }

    // Redirect to frontend dashboard
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard/sources?connected=${provider}`);
  } catch (err) {
    logger.error({ err }, 'Integration callback error');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard/sources?error=callback_failed`);
  }
});
