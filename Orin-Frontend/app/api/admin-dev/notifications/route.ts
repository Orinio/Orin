import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getSessionCookieName } from '@/lib/admin-auth';
import { getServerSupabase } from '@/lib/supabase-server';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getServerSupabase();
  const body = await request.json();
  const { userId, title, body: notifBody, type, link } = body;

  if (!userId || !title) {
    return NextResponse.json({ error: 'userId and title required' }, { status: 400 });
  }

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    body: notifBody || null,
    type: type || 'system',
    link: link || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('audit_log').insert({
    actor_role: 'admin',
    action: 'admin.sendNotification',
    entity_type: 'notifications',
    entity_id: userId,
    new_data: { title, type: type || 'system' },
  });

  return NextResponse.json({ success: true });
}
