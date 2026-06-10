import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { resolvePublicUserId } from '@/lib/utils';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: { code: 'CONFIG_ERROR', message: 'Supabase not configured' } }, { status: 500 });
    }

    const userId = await resolvePublicUserId(supabase);
    if (!userId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (!participants || participants.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const convIds = participants.map((p: { conversation_id: string }) => p.conversation_id);

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    const conversations = await Promise.all(
      (convs || []).map(async (conv: { id: string }) => {
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id)
          .neq('user_id', userId)
          .limit(1)
          .single();

        let otherUser = null;
        if (otherParticipant) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, username, full_name, avatar_url, headline')
            .eq('id', otherParticipant.user_id)
            .single();
          otherUser = userData;
        }

        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userId)
          .is('read_at', null);

        return {
          ...conv,
          other_user: otherUser,
          last_message: lastMsg,
          unread_count: unreadCount || 0,
        };
      })
    );

    return NextResponse.json({ success: true, data: conversations });
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
    const { receiverId } = body;

    if (!receiverId) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'receiverId is required' } }, { status: 400 });
    }

    if (userId === receiverId) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Cannot start conversation with yourself' } }, { status: 400 });
    }

    const { data: senderParticipations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (senderParticipations) {
      for (const sp of senderParticipations) {
        const { data: existingConv } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('conversation_id', sp.conversation_id)
          .eq('user_id', receiverId)
          .maybeSingle();

        if (existingConv) {
          return NextResponse.json({ success: true, data: { conversationId: sp.conversation_id } });
        }
      }
    }

    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convError) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: convError.message } }, { status: 500 });
    }

    await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conv.id, user_id: userId },
        { conversation_id: conv.id, user_id: receiverId },
      ]);

    return NextResponse.json({ success: true, data: { conversationId: conv.id } });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
