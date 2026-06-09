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
  const status = searchParams.get('status') || '';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('contact_messages')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ messages: data, total: count, page, limit });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { id, status } = body;

  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'resolved') updates.resolved_at = new Date().toISOString();

  const { error } = await supabase.from('contact_messages').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_log').insert({
    actor_role: 'admin',
    action: 'admin.updateMessage',
    entity_type: 'contact_messages',
    entity_id: id,
    new_data: { status },
  });

  return NextResponse.json({ success: true });
}
