import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_IDS: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_PRO || '',
  team: process.env.STRIPE_PRICE_TEAM || '',
  university: process.env.STRIPE_PRICE_UNIVERSITY || '',
};
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
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in to upgrade' } }, { status: 401 });
  }

  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_BODY', message: 'Invalid request body' } }, { status: 400 });
  }

  const { plan } = body;
  if (!plan || !STRIPE_PRICE_IDS[plan]) {
    return NextResponse.json(
      { error: { code: 'INVALID_PLAN', message: `Invalid plan. Valid plans: ${Object.keys(STRIPE_PRICE_IDS).join(', ')}` } },
      { status: 400 }
    );
  }

  // Resolve internal user ID
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', session.user.id)
    .maybeSingle();

  if (!userData?.id) {
    return NextResponse.json({ error: { code: 'USER_NOT_FOUND', message: 'User profile not found' } }, { status: 404 });
  }

  // Find or create Stripe customer
  const customerEmail = session.user.email!;
  let customerId: string | null = null;

  // Check if user already has a stripe_customer_id
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userData.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingSub?.stripe_customer_id) {
    customerId = existingSub.stripe_customer_id;
  }

  if (!customerId) {
    const customerRes = await stripeRequest('customers', 'POST', {
      email: customerEmail,
      metadata: { user_id: String(userData.id), auth_user_id: session.user.id } as Record<string, string>,
    });

    if (!customerRes.id) {
      return NextResponse.json(
        { error: { code: 'STRIPE_ERROR', message: 'Failed to create Stripe customer' } },
        { status: 502 }
      );
    }
    customerId = customerRes.id;
  }

  // Create checkout session
  const checkoutRes = await stripeRequest('checkout/sessions', 'POST', {
    customer: customerId!,
    mode: 'subscription',
    'line_items[0][price]': STRIPE_PRICE_IDS[plan],
    'line_items[0][quantity]': '1',
    success_url: `${APP_URL}/dashboard/billing?upgraded=true`,
    cancel_url: `${APP_URL}/dashboard/billing?canceled=true`,
    metadata: { user_id: String(userData.id), plan } as Record<string, string>,
    subscription_data: {
      metadata: { user_id: String(userData.id), plan } as Record<string, string>,
    },
  });

  if (!checkoutRes.url) {
    return NextResponse.json(
      { error: { code: 'STRIPE_ERROR', message: checkoutRes.message || 'Failed to create checkout session' } },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { url: checkoutRes.url, sessionId: checkoutRes.id },
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
