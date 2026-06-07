import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import type { Database } from '@/lib/supabase';
import { resolvePublicUserId } from '@/lib/utils';

type NotificationPrefsUpdate = Database['public']['Tables']['notification_preferences']['Update'];

export async function GET(request: NextRequest) {
  const supabase = await getServerSupabase();

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
const userId = await resolvePublicUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: prefs, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!prefs) {
    return NextResponse.json({
      preferences: {
        weekly_summary: true,
        recruiter_views: true,
        verification_changes: false,
        opportunity_matches: true,
        coach_tips: false,
        product_updates: true,
      },
    });
  }

  return NextResponse.json({ preferences: prefs });
}

export async function PATCH(request: NextRequest) {
  const supabase = await getServerSupabase();

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
const userId = await resolvePublicUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Partial<NotificationPrefsUpdate>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const allowedFields = [
    'weekly_summary', 'recruiter_views', 'verification_changes',
    'opportunity_matches', 'coach_tips', 'product_updates',
  ] as const;

  const updateData: Partial<NotificationPrefsUpdate> = {};
  for (const field of allowedFields) {
    if (field in body) {
      (updateData as Record<string, unknown>)[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('notification_preferences')
    .select('user_id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const { data: prefs, error } = await supabase
      .from('notification_preferences')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ preferences: prefs });
  }

  const { data: prefs, error } = await supabase
    .from('notification_preferences')
    .insert({
      user_id: userId,
      ...updateData,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ preferences: prefs });
}
