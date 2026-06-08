import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getSessionCookieName } from '@/lib/admin-auth';
import { getServerSupabase } from '@/lib/supabase-server';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();
  const { id } = await params;

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const [{ data: subscription }, { count: proofCount }, { count: sourceCount }, { data: notifications }] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('user_id', id).is('deleted_at', null).maybeSingle(),
    supabase.from('proof_cards').select('*', { count: 'exact', head: true }).eq('user_id', id).is('deleted_at', null),
    supabase.from('proof_sources').select('*', { count: 'exact', head: true }).eq('user_id', id).is('deleted_at', null),
    supabase.from('notifications').select('id, type, title, read_at').eq('user_id', id).is('deleted_at', null).order('created_at', { ascending: false }).limit(10),
  ]);

  return NextResponse.json({
    user,
    subscription: subscription || { plan: 'free', status: 'active' },
    proofCount: proofCount || 0,
    sourceCount: sourceCount || 0,
    recentNotifications: notifications || [],
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();
  const { id } = await params;
  const body = await request.json();

  const allowedFields = [
    'full_name', 'username', 'email', 'bio', 'headline', 'location', 'college', 'year',
    'role', 'account_status', 'is_profile_public', 'hide_email', 'avatar_url',
    'website_url', 'github_url', 'linkedin_url', 'twitter_url',
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data: oldUser } = await supabase.from('users').select('*').eq('id', id).single();

  const { error } = await supabase.from('users').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_log').insert({
    actor_role: 'admin',
    action: 'admin.updateUser',
    entity_type: 'users',
    entity_id: id,
    old_data: oldUser ? Object.fromEntries(Object.keys(updates).map(k => [k, oldUser[k]])) : null,
    new_data: updates,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();
  const { id } = await params;

  const { error } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString(), account_status: 'deactivated' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_log').insert({
    actor_role: 'admin',
    action: 'admin.deleteUser',
    entity_type: 'users',
    entity_id: id,
  });

  return NextResponse.json({ success: true });
}
