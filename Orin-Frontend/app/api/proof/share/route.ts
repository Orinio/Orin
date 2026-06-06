import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import type { Database } from '@/lib/supabase';
import { resolvePublicUserId } from '@/lib/utils';

type ProofShareInsert = Database['public']['Tables']['proof_shares']['Insert'];

export async function POST(request: NextRequest) {
  const supabase = await getServerSupabase();

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
const userId = await resolvePublicUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { proofId?: string; recipientEmail?: string; recipientName?: string; message?: string; kind?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { proofId, recipientEmail, recipientName, message, kind } = body;

  if (!proofId) {
    return NextResponse.json({ error: 'proofId is required' }, { status: 400 });
  }

  const shareKind = (kind || 'link') as 'link' | 'email' | 'recruiter_invite';
  if (!['link', 'email', 'recruiter_invite'].includes(kind || 'link')) {
    return NextResponse.json({ error: `kind must be one of: link, email, recruiter_invite` }, { status: 400 });
  }

  const { data: proof } = await supabase
    .from('proof_cards')
    .select('user_id')
    .eq('id', proofId)
    .single();

  if (!proof) {
    return NextResponse.json({ error: 'Proof not found' }, { status: 404 });
  }

  if (proof.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const insertData: ProofShareInsert = {
    proof_id: proofId,
    owner_id: userId,
    kind: shareKind,
    recipient_email: recipientEmail || '',
    recipient_name: recipientName || null,
    message: message || null,
  };

  const { data: share, error } = await supabase
    .from('proof_shares')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ share }, { status: 201 });
}
