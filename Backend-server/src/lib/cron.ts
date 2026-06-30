/**
 * Orin - Cron Scheduler
 * Handles periodic background jobs: GitHub sync, chain recomputation, etc.
 */

import { supabase } from './supabase.js';
import { logger } from './logger.js';
import { computeContentHash, signProof } from './proof-chain.js';

// ─── GitHub Auto-Sync ────────────────────────────────────────────────────────

async function decryptToken(encryptedToken: string): Promise<string> {
  // Lazy import to avoid circular deps
  const { decryptToken: decrypt } = await import('./token-crypto.js');
  return decrypt(encryptedToken);
}

async function syncGitHubForUser(userId: string, _integrationId: string, token: string): Promise<number> {
  let imported = 0;

  try {
    // Fetch repos from GitHub
    const resp = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!resp.ok) {
      logger.error({ status: resp.status, userId }, 'GitHub repos fetch failed during sync');
      return 0;
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

    // Fetch existing proofs
    const { data: existingProofs } = await supabase
      .from('proof_cards')
      .select('id, source_url, metadata')
      .eq('user_id', userId)
      .eq('source_type', 'github')
      .is('deleted_at', null);

    const existingByUrl = new Map(
      (existingProofs || []).map((p) => [p.source_url, p])
    );

    for (const repo of repos) {
      const existing = existingByUrl.get(repo.html_url);

      if (existing) {
        // Update metadata for existing repo
        const oldMeta = (existing.metadata || {}) as Record<string, unknown>;
        const newMeta: Record<string, unknown> = {
          ...oldMeta,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          topics: repo.topics,
          last_synced_at: new Date().toISOString(),
          updated_at_github: repo.updated_at,
        };

        // Recompute hash if metadata changed
        if (
          oldMeta.stars !== repo.stargazers_count ||
          oldMeta.forks !== repo.forks_count
        ) {
          const { data: proof } = await supabase
            .from('proof_cards')
            .select('title, description, skills_extracted, source_type, source_url')
            .eq('id', existing.id)
            .single();

          if (proof) {
            const newHash = computeContentHash({
              title: proof.title,
              description: proof.description,
              skillsExtracted: proof.skills_extracted || [],
              sourceType: proof.source_type,
              sourceUrl: proof.source_url,
              metadata: newMeta,
            });

            await supabase
              .from('proof_cards')
              .update({
                metadata: newMeta,
                content_hash: newHash,
                signature: signProof(newHash),
              })
              .eq('id', existing.id);
          } else {
            await supabase
              .from('proof_cards')
              .update({ metadata: newMeta })
              .eq('id', existing.id);
          }
        }
      } else {
        // Create new proof card for new repo
        const skills: string[] = [];
        if (repo.language) skills.push(repo.language);
        if (repo.topics?.length) skills.push(...repo.topics);

        const metadata = {
          imported_from: 'github',
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          topics: repo.topics,
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          default_branch: repo.default_branch,
          imported_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        };

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
            metadata,
          })
          .select('id, title, description, skills_extracted, source_type, source_url')
          .single();

        if (!error && proof) {
          // Compute and store content hash
          const contentHash = computeContentHash({
            title: proof.title,
            description: proof.description,
            skillsExtracted: proof.skills_extracted || [],
            sourceType: proof.source_type,
            sourceUrl: proof.source_url,
            metadata,
          });

          await supabase
            .from('proof_cards')
            .update({
              content_hash: contentHash,
              signature: signProof(contentHash),
            })
            .eq('id', proof.id);

          // Log chain event
          await supabase.from('proof_chain_events').insert({
            proof_id: proof.id,
            event_type: 'created',
            content_hash: contentHash,
            previous_hash: null,
            metadata: { source: 'github_sync' },
          });

          imported++;
        }
      }
    }

    logger.info({ userId, imported, total: repos.length }, 'GitHub sync completed');
  } catch (err) {
    logger.error({ err, userId }, 'GitHub sync error');
  }

  return imported;
}

// ─── Cron Jobs ───────────────────────────────────────────────────────────────

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

let syncTimer: ReturnType<typeof setInterval> | null = null;

async function runGitHubSync() {
  logger.info('Starting daily GitHub sync...');

  const { data: integrations, error } = await supabase
    .from('user_integrations')
    .select('id, user_id, access_token')
    .eq('provider', 'github')
    .eq('status', 'connected');

  if (error || !integrations) {
    logger.error({ err: error }, 'Failed to fetch GitHub integrations for sync');
    return;
  }

  let totalImported = 0;
  let successCount = 0;

  for (const integration of integrations) {
    try {
      const token = await decryptToken(integration.access_token);
      const imported = await syncGitHubForUser(
        integration.user_id,
        integration.id,
        token
      );
      totalImported += imported;
      successCount++;
    } catch (err) {
      logger.error({ err, userId: integration.user_id }, 'User GitHub sync failed');
    }
  }

  logger.info(
    { totalUsers: integrations.length, successCount, totalImported },
    'Daily GitHub sync completed'
  );
}

/**
 * Start the cron scheduler.
 */
export function startCron() {
  if (syncTimer) {
    logger.warn('Cron already running, skipping start');
    return;
  }

  logger.info('Starting cron scheduler...');

  // Run GitHub sync every 24 hours
  syncTimer = setInterval(runGitHubSync, SYNC_INTERVAL_MS);

  // Run initial sync after 5 minutes (give server time to stabilize)
  setTimeout(runGitHubSync, 5 * 60 * 1000);

  logger.info('Cron scheduler started');
}

/**
 * Stop the cron scheduler.
 */
export function stopCron() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    logger.info('Cron scheduler stopped');
  }
}

/**
 * Manually trigger GitHub sync (for admin use).
 */
export async function triggerManualSync(): Promise<{ queued: boolean }> {
  // Run async so the endpoint returns immediately
  runGitHubSync().catch((err) => {
    logger.error({ err }, 'Manual sync failed');
  });
  return { queued: true };
}
