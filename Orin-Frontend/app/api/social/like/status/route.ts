import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { resolvePublicUserId } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: { code: 'CONFIG_ERROR', message: 'Supabase not configured' } }, { status: 500 });
    }

    const userId = await resolvePublicUserId(supabase);
    if (!userId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const proofCardId = req.nextUrl.searchParams.get('proofCardId');
    if (!proofCardId) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'proofCardId is required' } }, { status: 400 });
    }

    const [{ data }, { count }] = await Promise.all([
      supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('proof_card_id', proofCardId)
        .maybeSingle(),
      supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('proof_card_id', proofCardId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        hasLiked: !!data,
        likeCount: count || 0,
      },
    });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
