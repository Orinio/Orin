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

    const page = Math.max(0, parseInt(req.nextUrl.searchParams.get('page') || '0'));
    const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '20')));

    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followingIds = (followData || []).map((f: { following_id: string }) => f.following_id);

    if (followingIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data: proofs, error } = await supabase
      .from('proof_cards')
      .select('*, users!inner(id, username, full_name, avatar_url, headline)')
      .in('user_id', followingIds)
      .eq('visibility', 'public')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
    }

    const posts = await Promise.all(
      (proofs || []).map(async (proof: { id: string }) => {
        const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
          supabase
            .from('likes')
            .select('id', { count: 'exact', head: true })
            .eq('proof_card_id', proof.id),
          supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('proof_card_id', proof.id),
        ]);

        return {
          ...proof,
          like_count: likeCount || 0,
          comment_count: commentCount || 0,
        };
      })
    );

    return NextResponse.json({ success: true, data: posts });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
