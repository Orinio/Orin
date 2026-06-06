import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import type { Database } from '@/lib/supabase';
import { resolvePublicUserId } from '@/lib/utils';

type SourceInsert = Database['public']['Tables']['proof_sources']['Insert'];

export async function GET(request: NextRequest) {
  const supabase = await getServerSupabase();

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get('userId');

  let userId: string | null = userIdParam;

  if (!userId) {
    userId = await resolvePublicUserId(supabase);
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: sources, error } = await supabase
    .from('proof_sources')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sources });
}

export async function POST(request: NextRequest) {
  const supabase = await getServerSupabase();

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
const userId = await resolvePublicUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Partial<SourceInsert>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { source_type, source_url, source_name } = body;

  if (!source_type) {
    return NextResponse.json({ error: 'source_type is required' }, { status: 400 });
  }

  const validSourceTypes = ['github', 'kaggle', 'certificate', 'hackathon', 'project', 'blog', 'demo', 'other'] as const;
  if (!validSourceTypes.includes(source_type as typeof validSourceTypes[number])) {
    return NextResponse.json({ error: `source_type must be one of: ${validSourceTypes.join(', ')}` }, { status: 400 });
  }

  const { data: source, error } = await supabase
    .from('proof_sources')
    .insert({
      user_id: userId,
      source_type: source_type as SourceInsert['source_type'],
      source_url: source_url || null,
      source_name: source_name || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ source }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await getServerSupabase();

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
const userId = await resolvePublicUserId(supabase);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get('id');

  if (!sourceId) {
    return NextResponse.json({ error: 'Source ID is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('proof_sources')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', sourceId)
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
