import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { requireOrgRole } from '../middleware/admin.js';

export const organizationsRouter = Router();

// ─── Helpers ───────────────────────────────────────────────

async function resolveInternalUserId(authUserId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  return data?.id || null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// ─── Validation Schemas ────────────────────────────────────

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/).optional(),
});

const updateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().optional().nullable(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

// ─── CRUD: Organizations ───────────────────────────────────

// POST /organizations — Create org
organizationsRouter.post('/', async (req, res) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const userId = await resolveInternalUserId(authUserId);
    if (!userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User profile not found' } });
      return;
    }

    const validation = createOrgSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validation.error.issues } });
      return;
    }

    const { name, slug: customSlug } = validation.data;
    const slug = customSlug || slugify(name);

    const { data: org, error } = await supabase
      .from('organizations')
      .insert({ name, slug, owner_id: userId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: { code: 'SLUG_TAKEN', message: 'Organization slug already exists' } });
        return;
      }
      throw error;
    }

    res.status(201).json({ success: true, data: org });
  } catch (err) {
    logger.error({ err }, 'Organization creation error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create organization' } });
  }
});

// GET /organizations — List user's orgs
organizationsRouter.get('/', async (req, res) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const userId = await resolveInternalUserId(authUserId);
    if (!userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User profile not found' } });
      return;
    }

    const { data: memberships, error } = await supabase
      .from('org_members')
      .select('role, status, joined_at, org_id, organizations(*)')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;

    const orgs = (memberships || [])
      .filter((m) => m.organizations)
      .map((m) => ({
        ...m.organizations,
        myRole: m.role,
        joinedAt: m.joined_at,
      }));

    res.json({ success: true, data: orgs });
  } catch (err) {
    logger.error({ err }, 'List organizations error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list organizations' } });
  }
});

// GET /organizations/:id — Get org details with members
organizationsRouter.get('/:id', async (req, res) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const userId = await resolveInternalUserId(authUserId);
    if (!userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User profile not found' } });
      return;
    }

    const { id } = req.params;

    // Check membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role, status')
      .eq('org_id', id)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.status !== 'active') {
      res.status(403).json({ error: { code: 'NOT_ORG_MEMBER', message: 'Not a member of this organization' } });
      return;
    }

    // Get org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (orgError || !org) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Organization not found' } });
      return;
    }

    // Get members with user info
    const { data: members } = await supabase
      .from('org_members')
      .select('*, user:users(id, email, username, full_name, avatar_url)')
      .eq('org_id', id);

    const orgWithMembers = {
      ...org,
      members: members || [],
      memberCount: members?.length || 0,
      myRole: membership.role,
    };

    res.json({ success: true, data: orgWithMembers });
  } catch (err) {
    logger.error({ err }, 'Get organization error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get organization' } });
  }
});

// PATCH /organizations/:id — Update org (owner/admin)
organizationsRouter.patch('/:id', requireOrgRole('owner', 'admin'), async (req, res) => {
  try {
    const validation = updateOrgSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validation.error.issues } });
      return;
    }

    const { id } = req.params;
    const updates = validation.data;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: { code: 'NO_CHANGES', message: 'No fields to update' } });
      return;
    }

    const { data: org, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: org });
  } catch (err) {
    logger.error({ err }, 'Update organization error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update organization' } });
  }
});

// DELETE /organizations/:id — Delete org (owner only)
organizationsRouter.delete('/:id', requireOrgRole('owner'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Organization deleted' });
  } catch (err) {
    logger.error({ err }, 'Delete organization error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete organization' } });
  }
});

// ─── Members ───────────────────────────────────────────────

// POST /organizations/:id/invite — Invite member
organizationsRouter.post('/:id/invite', requireOrgRole('owner', 'admin'), async (req, res) => {
  try {
    const validation = inviteMemberSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validation.error.issues } });
      return;
    }

    const { id: orgId } = req.params;
    const { email, role } = validation.data;
    const invitedBy = req.internalUserId!;

    // Check if user is already a member
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      const { data: existingMember } = await supabase
        .from('org_members')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (existingMember) {
        res.status(409).json({ error: { code: 'ALREADY_MEMBER', message: 'User is already a member' } });
        return;
      }
    }

    // Check for pending invitation
    const { data: existingInvite } = await supabase
      .from('org_invitations')
      .select('id')
      .eq('org_id', orgId)
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvite) {
      res.status(409).json({ error: { code: 'INVITE_PENDING', message: 'Invitation already pending' } });
      return;
    }

    // Create invitation
    const { data: invite, error } = await supabase
      .from('org_invitations')
      .insert({
        org_id: orgId,
        email,
        role,
        invited_by: invitedBy,
        user_id: existingUser?.id || null,
      })
      .select()
      .single();

    if (error) throw error;

    // If user exists, add them directly as a member
    if (existingUser) {
      await supabase
        .from('org_members')
        .insert({
          org_id: orgId,
          user_id: existingUser.id,
          role,
          status: 'active',
          invited_by: invitedBy,
        });

      // Mark invitation as accepted
      await supabase
        .from('org_invitations')
        .update({ status: 'accepted' })
        .eq('id', invite.id);
    }

    res.status(201).json({ success: true, data: invite });
  } catch (err) {
    logger.error({ err }, 'Invite member error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to invite member' } });
  }
});

// PATCH /organizations/:id/members/:userId — Update member role (owner only)
organizationsRouter.patch('/:id/members/:userId', requireOrgRole('owner'), async (req, res) => {
  try {
    const validation = updateMemberRoleSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validation.error.issues } });
      return;
    }

    const { id: orgId, userId: targetUserId } = req.params;
    const { role } = validation.data;

    // Prevent owner from demoting themselves
    if (targetUserId === req.internalUserId && role !== 'owner') {
      res.status(400).json({ error: { code: 'CANNOT_DEMOTE_SELF', message: 'Owner cannot change their own role' } });
      return;
    }

    const { data: member, error } = await supabase
      .from('org_members')
      .update({ role })
      .eq('org_id', orgId)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) throw error;

    // If transferring ownership, update org owner_id
    if (role === 'owner') {
      await supabase
        .from('organizations')
        .update({ owner_id: targetUserId })
        .eq('id', orgId);

      // Demote previous owner to admin
      await supabase
        .from('org_members')
        .update({ role: 'admin' })
        .eq('org_id', orgId)
        .eq('user_id', req.internalUserId);
    }

    res.json({ success: true, data: member });
  } catch (err) {
    logger.error({ err }, 'Update member role error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update member role' } });
  }
});

// DELETE /organizations/:id/members/:userId — Remove member (owner/admin)
organizationsRouter.delete('/:id/members/:userId', requireOrgRole('owner', 'admin'), async (req, res) => {
  try {
    const { id: orgId, userId: targetUserId } = req.params;

    // Cannot remove owner
    const { data: org } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', orgId)
      .single();

    if (org?.owner_id === targetUserId) {
      res.status(400).json({ error: { code: 'CANNOT_REMOVE_OWNER', message: 'Cannot remove the organization owner' } });
      return;
    }

    const { error } = await supabase
      .from('org_members')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', targetUserId);

    if (error) throw error;

    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    logger.error({ err }, 'Remove member error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to remove member' } });
  }
});

// POST /organizations/:id/leave — Leave org
organizationsRouter.post('/:id/leave', async (req, res) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const userId = await resolveInternalUserId(authUserId);
    if (!userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User profile not found' } });
      return;
    }

    const { id: orgId } = req.params;

    // Check if user is owner
    const { data: org } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', orgId)
      .single();

    if (org?.owner_id === userId) {
      res.status(400).json({ error: { code: 'OWNER_CANNOT_LEAVE', message: 'Owner cannot leave. Transfer ownership first.' } });
      return;
    }

    const { error } = await supabase
      .from('org_members')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, message: 'Left organization' });
  } catch (err) {
    logger.error({ err }, 'Leave organization error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to leave organization' } });
  }
});

// POST /organizations/switch/:orgId — Switch current org context
organizationsRouter.post('/switch/:orgId', async (req, res) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const userId = await resolveInternalUserId(authUserId);
    if (!userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User profile not found' } });
      return;
    }

    const { orgId } = req.params;

    // Switch to personal context
    if (orgId === 'personal') {
      const { error } = await supabase
        .from('users')
        .update({ current_org_id: null })
        .eq('id', userId);

      if (error) throw error;
      res.json({ success: true, data: { currentOrgId: null } });
      return;
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role, status')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.status !== 'active') {
      res.status(403).json({ error: { code: 'NOT_ORG_MEMBER', message: 'Not a member of this organization' } });
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ current_org_id: orgId })
      .eq('id', userId);

    if (error) throw error;

    res.json({ success: true, data: { currentOrgId: orgId, role: membership.role } });
  } catch (err) {
    logger.error({ err }, 'Switch org context error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to switch organization' } });
  }
});
