import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { username } = await params;

  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .is('deleted_at', null)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { data: proofs } = await supabase
    .from('proof_cards')
    .select('*')
    .eq('user_id', user.id)
    .eq('visibility', 'public')
    .eq('verification_status', 'verified')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const allSkills = proofs
    ?.flatMap((s) => s.skills_extracted || [])
    .filter((v, i, a) => a.indexOf(v) === i) || [];

  return NextResponse.json({
    user,
    proofs: proofs || [],
    skills: allSkills,
  });
}
