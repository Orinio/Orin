import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: { code: 'BILLING_NOT_CONFIGURED', message: 'Stripe is not configured. Set STRIPE_SECRET_KEY env var.' } },
      { status: 503 }
    );
  }

  // Auth check
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in to manage subscription' } }, { status: 401 });
  }

  // Resolve internal user ID and find Stripe customer
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', session.user.id)
    .maybeSingle();

  if (!userData?.id) {
    return NextResponse.json({ error: { code: 'USER_NOT_FOUND', message: 'User profile not found' } }, { status: 404 });
  }

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userData.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existingSub?.stripe_customer_id) {
    return NextResponse.json(
      { error: { code: 'NO_SUBSCRIPTION', message: 'No active subscription found' } },
      { status: 404 }
    );
  }

  // Create billing portal session
  const portalRes = await stripeRequest('billing_portal/sessions', 'POST', {
    customer: existingSub.stripe_customer_id,
    return_url: `${APP_URL}/dashboard/billing`,
  });

  if (!portalRes.url) {
    return NextResponse.json(
      { error: { code: 'STRIPE_ERROR', message: portalRes.message || 'Failed to create portal session' } },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { url: portalRes.url },
  });
}

async function stripeRequest(path: string, method: string, params: Record<string, string>): Promise<any> {
  const url = `https://api.stripe.com/v1/${path}`;
  const body = method === 'POST'
    ? new URLSearchParams(params).toString()
    : undefined;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  return res.json();
}
