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
  const status = searchParams.get('status') || '';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('proof_cards')
    .select('*, users:user_id(id, email, username)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('verification_status', status);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ proofs: data, total: count, page, limit });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();
  const body = await request.json();
  const { proofId, action } = body;

  if (!proofId || !action) {
    return NextResponse.json({ error: 'proofId and action required' }, { status: 400 });
  }

  let update: Record<string, unknown> = {};

  switch (action) {
    case 'verify':
      update = { verification_status: 'verified', verified_at: new Date().toISOString() };
      break;
    case 'reject':
      update = { verification_status: 'rejected' };
      break;
    case 'pend':
      update = { verification_status: 'pending' };
      break;
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  await supabase.from('audit_log').insert({
    actor_role: 'admin',
    action: `admin.${action}Proof`,
    entity_type: 'proof_cards',
    entity_id: proofId,
    new_data: update,
  });

  const { error } = await supabase.from('proof_cards').update(update).eq('id', proofId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();
  const { searchParams } = new URL(request.url);
  const proofId = searchParams.get('proofId');

  if (!proofId) return NextResponse.json({ error: 'proofId required' }, { status: 400 });

  const { error } = await supabase
    .from('proof_cards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', proofId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_log').insert({
    actor_role: 'admin',
    action: 'admin.deleteProof',
    entity_type: 'proof_cards',
    entity_id: proofId,
  });

  return NextResponse.json({ success: true });
}
