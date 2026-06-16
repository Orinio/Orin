import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { checkAIRateLimit, logAIUsage } from '@/lib/rate-limit';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

const PATH_TO_RATE_LIMIT_KEY: Record<string, string> = {
  '/ai/chat': 'ai-chat',
  '/ai/verify': 'ai-verify',
  '/ai/match': 'ai-match-opportunities',
  '/ai/skills': 'ai-skills',
  '/ai/learning-path': 'ai-chat',
};

async function resolveAuthToken(req: NextRequest): Promise<string | null> {
  const headerToken = req.headers.get('Authorization');
  if (headerToken) return headerToken;

  try {
    const supabase = await getServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return `Bearer ${session.access_token}`;
    }
  } catch {
    // Fall through
  }

  return null;
}

export async function forwardToBackend(
  req: NextRequest,
  path: string,
  options?: { method?: string; body?: any; streaming?: boolean }
): Promise<NextResponse> {
  const authHeader = await resolveAuthToken(req);
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit AI endpoints
  const rateLimitKey = PATH_TO_RATE_LIMIT_KEY[path];
  if (rateLimitKey) {
    try {
      const supabase = await getServerSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (userData?.id) {
          const rateLimit = await checkAIRateLimit(supabase, userData.id, rateLimitKey);
          if (!rateLimit.allowed) {
            return NextResponse.json(
              { error: { code: 'RATE_LIMITED', message: rateLimit.reason || 'Rate limit exceeded' } },
              { status: 429, headers: { 'Retry-After': rateLimit.nextAllowedAt ? String(Math.ceil((rateLimit.nextAllowedAt.getTime() - Date.now()) / 1000)) : '60' } }
            );
          }
        }
      }
    } catch {
      // Rate limit check is best-effort — don't block if it fails
    }
  }

  const headers: Record<string, string> = {
    'Authorization': authHeader,
  };

  const contentType = req.headers.get('Content-Type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const accept = req.headers.get('Accept');
  if (accept) {
    headers['Accept'] = accept;
  }

  const method = options?.method || req.method;
  let body: string | undefined;

  if (method !== 'GET' && method !== 'HEAD') {
    if (options?.body) {
      body = JSON.stringify(options.body);
    } else {
      try {
        body = await req.text();
      } catch {}
    }
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers,
      body,
    });

    // If backend returned an error before streaming started, surface it
    if (!backendRes.ok && options?.streaming) {
      const errorText = await backendRes.text().catch(() => '');
      let errorData: any;
      try { errorData = JSON.parse(errorText); } catch { errorData = { error: errorText }; }
      console.error(`Backend ${backendRes.status} for ${path}:`, errorData);
      return NextResponse.json(
        { error: errorData?.error?.message || errorData?.error || `Backend returned ${backendRes.status}` },
        { status: backendRes.status }
      );
    }

    if (options?.streaming && backendRes.headers.get('Content-Type')?.includes('text/event-stream')) {
      const reader = backendRes.body?.getReader();
      if (!reader) {
        return new NextResponse('No stream', { status: 500 });
      }

      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } finally {
            controller.close();
          }
        },
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const responseText = await backendRes.text();
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // Log AI usage on success
    if (backendRes.ok && rateLimitKey) {
      try {
        const supabase = await getServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          if (userData?.id) {
            logAIUsage(supabase, userData.id, rateLimitKey).catch(() => {});
          }
        }
      } catch {}
    }

    return NextResponse.json(responseData, { status: backendRes.status });
  } catch (error) {
    console.error(`Backend request failed for ${path}:`, error);
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}