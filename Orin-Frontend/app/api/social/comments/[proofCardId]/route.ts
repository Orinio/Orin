import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { resolvePublicUserId } from '@/lib/utils';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ proofCardId: string }> }) {
  try {
    const supabase = await getServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: { code: 'CONFIG_ERROR', message: 'Supabase not configured' } }, { status: 500 });
    }

    const { proofCardId } = await params;

    const { data, error } = await supabase
      .from('comments')
      .select('*, users!inner(full_name, avatar_url, username)')
      .eq('proof_card_id', proofCardId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

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
    const { proofCardId, content, parentId } = body;

    if (!proofCardId || !content) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'proofCardId and content are required' } }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        proof_card_id: proofCardId,
        content,
        parent_id: parentId || null,
      })
      .select('*, users!inner(full_name, avatar_url, username)')
      .single();

    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: { code: 'CONFIG_ERROR', message: 'Supabase not configured' } }, { status: 500 });
    }

    const userId = await resolvePublicUserId(supabase);
    if (!userId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const commentId = req.nextUrl.searchParams.get('commentId');
    if (!commentId) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'commentId is required' } }, { status: 400 });
    }

    const { data: comment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!comment || comment.user_id !== userId) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not your comment' } }, { status: 403 });
    }

    const { error } = await supabase.from('comments').delete().eq('id', commentId);

    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
