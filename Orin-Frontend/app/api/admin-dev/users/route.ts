import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getSessionCookieName } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select('id, email, username, full_name, role, account_status, created_at, last_login_at, auth_provider', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data, total: count, page, limit });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { userId, action, value } = body;

  if (!userId || !action) {
    return NextResponse.json({ error: 'userId and action required' }, { status: 400 });
  }

  let update: Record<string, unknown> = {};

  switch (action) {
    case 'setRole':
      update = { role: value };
      break;
    case 'setStatus':
      update = { account_status: value };
      break;
    case 'suspend':
      update = { account_status: 'suspended' };
      break;
    case 'activate':
      update = { account_status: 'active' };
      break;
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Log the audit event
  await supabase.from('audit_log').insert({
    actor_role: 'admin',
    action: `admin.${action}`,
    entity_type: 'users',
    entity_id: userId,
    new_data: update,
  });

  const { error } = await supabase.from('users').update(update).eq('id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  // Soft delete
  const { error } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString(), account_status: 'deactivated' })
    .eq('id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_log').insert({
    actor_role: 'admin',
    action: 'admin.deleteUser',
    entity_type: 'users',
    entity_id: userId,
  });

  return NextResponse.json({ success: true });
}
