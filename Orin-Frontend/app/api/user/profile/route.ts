import { NextRequest, NextResponse } from 'next/server';
import { supabase, Database } from '@/lib/supabase';

type UserUpdate = Database['public']['Tables']['users']['Update'];

export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .is('deleted_at', null)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Partial<UserUpdate>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const allowedFields = [
    'full_name', 'username', 'bio', 'headline', 'location',
    'college', 'year', 'avatar_url', 'website_url', 'github_url',
    'linkedin_url', 'twitter_url', 'is_profile_public', 'hide_email',
  ] as const;

  const updateData: Partial<UserUpdate> = {};
  for (const field of allowedFields) {
    if (field in body) {
      (updateData as Record<string, unknown>)[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: profile, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('auth_user_id', session.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
