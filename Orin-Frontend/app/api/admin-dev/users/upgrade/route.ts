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
    .select('id, email, full_name, username, role')
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

  const { data: currentSub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', targetUser.id)
    .is('deleted_at', null)
    .maybeSingle();

  const subUpdates: Record<string, unknown> = {};
  if (plan) subUpdates.plan = plan;
  if (status) subUpdates.status = status;
  if (expiresAt !== undefined) subUpdates.current_period_end = expiresAt;

  if (Object.keys(subUpdates).length > 0) {
    const { error: updateError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: targetUser.id,
        ...subUpdates,
      }, { onConflict: 'user_id' });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  await supabase.from('audit_log').insert({
    actor_role: 'admin',
    action: 'admin_action',
    entity_type: 'subscriptions',
    entity_id: targetUser.id,
    old_data: { plan: currentSub?.plan || 'free', status: currentSub?.status || 'active' },
    new_data: { plan: plan || currentSub?.plan || 'free', status: status || currentSub?.status || 'active' },
  });

  return NextResponse.json({
    success: true,
    user: {
      id: targetUser.id,
      email: targetUser.email,
      fullName: targetUser.full_name,
      username: targetUser.username,
      previousPlan: currentSub?.plan || 'free',
      newPlan: plan || currentSub?.plan || 'free',
      previousStatus: currentSub?.status || 'active',
      newStatus: status || currentSub?.status || 'active',
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
    .select('id, email, username, full_name, role, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (search) {
    query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data: users, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = (users || []).map(u => u.id);
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('user_id, plan, status, current_period_end')
    .in('user_id', userIds)
    .is('deleted_at', null);

  const subMap = new Map((subs || []).map(s => [s.user_id, s]));

  const enrichedUsers = (users || []).map(u => ({
    ...u,
    subscription_plan: subMap.get(u.id)?.plan || 'free',
    subscription_status: subMap.get(u.id)?.status || 'active',
    subscription_expires_at: subMap.get(u.id)?.current_period_end || null,
  }));

  return NextResponse.json({ users: enrichedUsers });
}
