import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getSessionCookieName } from '@/lib/admin-auth';
import { getServerSupabase } from '@/lib/supabase-server';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('opportunities')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
  }
  if (type) {
    query = query.eq('type', type);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ opportunities: data, total: count, page, limit });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();
  const body = await request.json();

  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      title: body.title,
      company: body.company,
      type: body.type,
      description: body.description,
      location: body.location,
      is_remote: body.is_remote ?? false,
      link: body.link,
      required_skills: body.required_skills || [],
      nice_to_have: body.nice_to_have || [],
      salary_min: body.salary_min,
      salary_max: body.salary_max,
      salary_currency: body.salary_currency || 'USD',
      is_active: body.is_active ?? true,
      posted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_log').insert({
    actor_role: 'admin',
    action: 'admin.createOpportunity',
    entity_type: 'opportunities',
    entity_id: data.id,
    new_data: { title: body.title, company: body.company },
  });

  return NextResponse.json({ success: true, opportunity: data });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('opportunities').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_log').insert({
    actor_role: 'admin',
    action: 'admin.updateOpportunity',
    entity_type: 'opportunities',
    entity_id: id,
    new_data: updates,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from('opportunities').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_log').insert({
    actor_role: 'admin',
    action: 'admin.deleteOpportunity',
    entity_type: 'opportunities',
    entity_id: id,
  });

  return NextResponse.json({ success: true });
}
