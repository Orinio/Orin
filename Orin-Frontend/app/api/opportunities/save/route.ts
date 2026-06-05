import { NextRequest, NextResponse } from 'next/server';
import { supabase, Database } from '@/lib/supabase';

type UserOpportunityInsert = Database['public']['Tables']['user_opportunities']['Insert'];

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { opportunityId?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { opportunityId, status } = body;

  if (!opportunityId || !status) {
    return NextResponse.json({ error: 'opportunityId and status are required' }, { status: 400 });
  }

  const validStatuses = ['saved', 'applied', 'dismissed', 'interviewing', 'rejected', 'offered'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', session.user.id)
    .single();

  if (!userData) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  const insertData: UserOpportunityInsert = {
    user_id: userData.id,
    opportunity_id: opportunityId,
    status: status as UserOpportunityInsert['status'],
  };

  const { data: existing } = await supabase
    .from('user_opportunities')
    .select('id')
    .eq('user_id', userData.id)
    .eq('opportunity_id', opportunityId)
    .maybeSingle();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from('user_opportunities')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    result = data;
  } else {
    const { data, error } = await supabase
      .from('user_opportunities')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    result = data;
  }

  return NextResponse.json({ userOpportunity: result }, { status: 200 });
}
