import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { resolvePublicUserId } from '@/lib/utils';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const supabase = await getServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: { code: 'CONFIG_ERROR', message: 'Supabase not configured' } }, { status: 500 });
    }

    const userId = await resolvePublicUserId(supabase);
    if (!userId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { conversationId } = await params;

    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not a participant' } }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const supabase = await getServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: { code: 'CONFIG_ERROR', message: 'Supabase not configured' } }, { status: 500 });
    }

    const userId = await resolvePublicUserId(supabase);
    if (!userId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { conversationId } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'content is required' } }, { status: 400 });
    }

    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not a participant' } }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
