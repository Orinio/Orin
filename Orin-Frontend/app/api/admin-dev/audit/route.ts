import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getSessionCookieName } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  const { data, count, error } = await supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ logs: data, total: count, page, limit });
}
