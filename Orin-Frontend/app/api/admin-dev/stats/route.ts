import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getSessionCookieName } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) return null;
  const session = validateSession(token);
  if (!session) return null;
  return session;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const [
      { count: totalUsers },
      { count: totalProofs },
      { count: totalOpportunities },
      { count: totalMessages },
      { count: verifiedProofs },
      { count: pendingProofs },
      { count: activeUsers },
      { data: recentUsers },
      { data: recentProofs },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('proof_cards').select('*', { count: 'exact', head: true }),
      supabase.from('opportunities').select('*', { count: 'exact', head: true }),
      supabase.from('contact_messages').select('*', { count: 'exact', head: true }),
      supabase.from('proof_cards').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
      supabase.from('proof_cards').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('account_status', 'active'),
      supabase.from('users').select('id, email, username, full_name, role, account_status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('proof_cards').select('id, title, verification_status, source_type, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalProofs: totalProofs || 0,
        totalOpportunities: totalOpportunities || 0,
        totalMessages: totalMessages || 0,
        verifiedProofs: verifiedProofs || 0,
        pendingProofs: pendingProofs || 0,
        activeUsers: activeUsers || 0,
      },
      recentUsers: recentUsers || [],
      recentProofs: recentProofs || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
