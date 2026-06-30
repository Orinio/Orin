/**
 * Orin Frontend - Proof Chain API Route
 * Fetches chain events for a proof card.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_ID', message: 'Proof ID is required' } },
      { status: 400 }
    );
  }

  const supabase = await getServerSupabase();

  // Fetch chain events
  const { data: events, error } = await supabase
    .from('proof_chain_events')
    .select('*')
    .eq('proof_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  // Fetch proof trust tier
  const { data: proof } = await supabase
    .from('proof_cards')
    .select('trust_tier, content_hash, chain_version, verification_count, last_verified_at')
    .eq('id', id)
    .single();

  return NextResponse.json({
    success: true,
    data: {
      events: (events || []).map((e) => ({
        id: e.id,
        eventType: e.event_type,
        contentHash: e.content_hash,
        previousHash: e.previous_hash,
        metadata: e.metadata,
        createdAt: e.created_at,
      })),
      trustTier: proof?.trust_tier || 'none',
      contentHash: proof?.content_hash,
      chainVersion: proof?.chain_version,
      verificationCount: proof?.verification_count,
      lastVerifiedAt: proof?.last_verified_at,
    },
  });
}
