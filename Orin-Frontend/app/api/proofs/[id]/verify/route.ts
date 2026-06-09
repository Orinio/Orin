import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * POST /api/proofs/[id]/verify
 * Triggers AI auto-verification for a proof card.
 * Calls the backend verification agent which uses tools like
 * verify_github_repo, verify_certificate, verify_kaggle, etc.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proofId } = await params;

  // Authenticate the user via Supabase session
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Load the proof card
  const admin = getSupabaseAdmin();
  const { data: proof, error: proofError } = await admin
    .from('proof_cards')
    .select('*')
    .eq('id', proofId)
    .is('deleted_at', null)
    .single();

  if (proofError || !proof) {
    return NextResponse.json({ error: 'Proof not found' }, { status: 404 });
  }

  // Mark proof as pending verification
  await admin
    .from('proof_cards')
    .update({ verification_status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', proofId);

  // If no source URL, we can still do a text-based analysis
  if (!proof.source_url) {
    // For proofs without URLs (e.g., "project", "hackathon"), do a web search verification
    try {
      const backendRes = await fetch(`${BACKEND_URL}/ai/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'custom',
          query: `Verify this ${proof.source_type} proof by searching the web: "${proof.title}" - ${proof.description || 'No description'}. Skills claimed: ${(proof.skills_extracted || []).join(', ')}. Check if this project/certificate/hackathon exists and is legitimate.`,
          proofId: proof.id,
        }),
      });

      const result = await backendRes.json();

      if (result.success && result.result) {
        const answer = result.result.answer || '';
        const isVerified = answer.toLowerCase().includes('verified') ||
          answer.toLowerCase().includes('confirmed') ||
          answer.toLowerCase().includes('legitimate');

        await admin
          .from('proof_cards')
          .update({
            verification_status: isVerified ? 'verified' : 'pending',
            verified_at: isVerified ? new Date().toISOString() : null,
            metadata: {
              ...proof.metadata,
              auto_verification: {
                verified: isVerified,
                timestamp: new Date().toISOString(),
                method: 'ai_web_search',
                answer: answer.slice(0, 1000),
                toolCalls: result.result.toolCalls?.length || 0,
              },
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', proofId);

        // Notify user
        await admin.from('notifications').insert({
          user_id: proof.user_id,
          type: 'verification_update',
          title: isVerified ? 'Proof verified!' : 'Proof needs review',
          body: isVerified
            ? `Your proof "${proof.title}" has been automatically verified.`
            : `Your proof "${proof.title}" could not be automatically verified and is pending review.`,
          link: `/dashboard/proof/${proof.id}`,
          payload: { proofId: proof.id, verified: isVerified },
        });

        return NextResponse.json({
          success: true,
          verified: isVerified,
          answer: answer.slice(0, 500),
        });
      }
    } catch (err) {
      console.error('Auto-verification error (no URL):', err);
    }

    return NextResponse.json({
      success: true,
      verified: false,
      message: 'Verification queued, pending manual review',
    });
  }

  // For proofs with URLs, use the dedicated verification agent
  try {
    const backendRes = await fetch(`${BACKEND_URL}/ai/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'verify',
        proofId: proof.id,
        proofUrl: proof.source_url,
        sourceType: proof.source_type,
      }),
    });

    const result = await backendRes.json();

    if (result.success && result.result) {
      return NextResponse.json({
        success: true,
        verified: result.result.verified,
        thinking: result.result.thinking,
        toolCalls: result.result.toolCalls,
        answer: result.result.answer,
        iterations: result.result.iterations,
        model: result.result.model,
      });
    }

    // Backend returned an error or unavailable — try direct web search fallback
    const fallbackRes = await fetch(`${BACKEND_URL}/ai/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'custom',
        query: `Verify this ${proof.source_type} proof: ${proof.source_url}. Title: "${proof.title}". Check if this URL exists and matches the claimed proof.`,
        proofId: proof.id,
      }),
    });

    const fallbackResult = await fallbackRes.json();

    if (fallbackResult.success && fallbackResult.result) {
      const answer = fallbackResult.result.answer || '';
      const isVerified = answer.toLowerCase().includes('verified') ||
        answer.toLowerCase().includes('confirmed') ||
        answer.toLowerCase().includes('exists');

      await admin
        .from('proof_cards')
        .update({
          verification_status: isVerified ? 'verified' : 'pending',
          verified_at: isVerified ? new Date().toISOString() : null,
          metadata: {
            ...proof.metadata,
            auto_verification: {
              verified: isVerified,
              timestamp: new Date().toISOString(),
              method: 'ai_web_search_fallback',
              answer: answer.slice(0, 1000),
            },
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', proofId);

      await admin.from('notifications').insert({
        user_id: proof.user_id,
        type: 'verification_update',
        title: isVerified ? 'Proof verified!' : 'Proof needs review',
        body: isVerified
          ? `Your proof "${proof.title}" has been automatically verified.`
          : `Your proof "${proof.title}" could not be automatically verified and is pending review.`,
        link: `/dashboard/proof/${proof.id}`,
        payload: { proofId: proof.id, verified: isVerified },
      });

      return NextResponse.json({
        success: true,
        verified: isVerified,
        answer: answer.slice(0, 500),
      });
    }

    return NextResponse.json({
      success: true,
      verified: false,
      message: 'Verification queued, pending manual review',
    });
  } catch (err) {
    console.error('Auto-verification error:', err);
    return NextResponse.json({
      success: true,
      verified: false,
      message: 'Verification service temporarily unavailable, queued for retry',
    });
  }
}
