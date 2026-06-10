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
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'followingId is required' } }, { status: 400 });
    }

    if (userId === followingId) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Cannot follow yourself' } }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (existing) {
      await supabase.from('follows').delete().eq('id', existing.id);
      return NextResponse.json({ success: true, data: { isFollowing: false } });
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: userId, following_id: followingId });

      if (error) {
        return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: { isFollowing: true } });
    }
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
