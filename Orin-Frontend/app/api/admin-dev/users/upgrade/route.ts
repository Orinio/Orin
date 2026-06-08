import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getSessionCookieName } from '@/lib/admin-auth';
import { getServerSupabase } from '@/lib/supabase-server';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();

  let body: { targetUserId?: string; targetEmail?: string; plan?: string; status?: string; expiresAt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { targetUserId, targetEmail, plan, status, expiresAt } = body;

  if (!targetUserId && !targetEmail) {
    return NextResponse.json({ error: 'targetUserId or targetEmail is required' }, { status: 400 });
  }

  if (plan && !['free', 'pro', 'team'].includes(plan)) {
    return NextResponse.json({ error: 'plan must be free, pro, or team' }, { status: 400 });
  }

  if (status && !['active', 'canceled', 'past_due', 'trialing', 'incomplete'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  let query = supabase
    .from('users')
    .select('id, email, full_name, username, role, subscription_plan, subscription_status')
    .is('deleted_at', null);

  if (targetUserId) {
    query = query.eq('id', targetUserId);
  } else if (targetEmail) {
    query = query.eq('email', targetEmail);
  }

  const { data: targetUser, error: findError } = await query.single();

  if (findError || !targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (plan) updates.subscription_plan = plan;
  if (status) updates.subscription_status = status;
  if (expiresAt !== undefined) updates.subscription_expires_at = expiresAt;
  updates.updated_at = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', targetUser.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from('audit_log').insert({
    actor_role: 'admin',
    action: 'admin.upgradePlan',
    entity_type: 'users',
    entity_id: targetUser.id,
    old_data: { subscription_plan: targetUser.subscription_plan, subscription_status: targetUser.subscription_status },
    new_data: { subscription_plan: plan || targetUser.subscription_plan, subscription_status: status || targetUser.subscription_status },
  });

  return NextResponse.json({
    success: true,
    user: {
      id: targetUser.id,
      email: targetUser.email,
      fullName: targetUser.full_name,
      username: targetUser.username,
      previousPlan: targetUser.subscription_plan,
      newPlan: plan || targetUser.subscription_plan,
      previousStatus: targetUser.subscription_status,
      newStatus: status || targetUser.subscription_status,
    },
  });
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  let query = supabase
    .from('users')
    .select('id, email, username, full_name, role, subscription_plan, subscription_status, subscription_expires_at, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (search) {
    query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data });
}
