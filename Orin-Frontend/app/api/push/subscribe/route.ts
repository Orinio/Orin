import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { endpoint, keys } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Missing subscription keys' }, { status: 400 });
  }

  // Get internal user ID
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Upsert subscription (one per endpoint per user)
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userData.id,
      endpoint,
      p256dh: keys.p256dh,
      auth_key: keys.auth,
      user_agent: request.headers.get('user-agent') || null,
      platform: 'web',
      is_active: true,
    }, { onConflict: 'user_id,endpoint' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (body.endpoint) {
    // Deactivate specific subscription
    await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userData.id)
      .eq('endpoint', body.endpoint);
  } else {
    // Deactivate all subscriptions for user
    await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userData.id);
  }

  return NextResponse.json({ success: true });
}
