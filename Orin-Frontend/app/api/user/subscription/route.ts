import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { resolvePublicUserId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const supabase = await getServerSupabase();

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
const userId = await resolvePublicUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!subscription) {
    const { data: created, error: createError } = await supabase
      .from('subscriptions')
      .insert({ user_id: userId })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ subscription: created });
  }

  return NextResponse.json({ subscription });
}
