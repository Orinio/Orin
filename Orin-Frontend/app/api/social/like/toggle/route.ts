import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { resolvePublicUserId } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: { code: 'CONFIG_ERROR', message: 'Supabase not configured' } }, { status: 500 });
    }

    const userId = await resolvePublicUserId(supabase);
    if (!userId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const body = await req.json();
    const { proofCardId } = body;

    if (!proofCardId) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'proofCardId is required' } }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('proof_card_id', proofCardId)
      .maybeSingle();

    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id);
      return NextResponse.json({ success: true, data: { hasLiked: false } });
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ user_id: userId, proof_card_id: proofCardId });

      if (error) {
        return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: { hasLiked: true } });
    }
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
