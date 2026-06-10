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

    const targetUserId = req.nextUrl.searchParams.get('targetUserId');
    if (!targetUserId) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'targetUserId is required' } }, { status: 400 });
    }

    const [{ data: followData }, { count: followerCount }, { count: followingCount }] = await Promise.all([
      supabase
        .from('follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)
        .maybeSingle(),
      supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', targetUserId),
      supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', targetUserId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        isFollowing: !!followData,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
      },
    });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
