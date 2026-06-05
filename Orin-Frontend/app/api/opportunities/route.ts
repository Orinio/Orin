import { NextRequest, NextResponse } from 'next/server';
import { supabase, Database } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20', 10)), 100);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('opportunities')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .is('deleted_at', null);

  if (company) {
    const safeCompany = company.replace(/[%_]/g, (m) => `\\${m}`);
    query = query.ilike('company', `%${safeCompany}%`);
  }

  if (type) {
    const validTypes = ['internship', 'job', 'scholarship', 'mentorship', 'hackathon', 'research', 'other'] as const;
    if ((validTypes as readonly string[]).includes(type)) {
      query = query.eq('type', type as Database['public']['Tables']['opportunities']['Row']['type']);
    }
  }

  if (search) {
    const safeSearch = search.replace(/[%_]/g, (m) => `\\${m}`);
    query = query.or(`title.ilike.%${safeSearch}%,company.ilike.%${safeSearch}%`);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: opportunities, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    opportunities,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}
