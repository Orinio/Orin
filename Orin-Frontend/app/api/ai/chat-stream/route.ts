import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { createMemoryStore, extractMemoryFromMessage } from '@/lib/ai-memory';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function resolveAuthToken(req: NextRequest): Promise<string | null> {
  const headerToken = req.headers.get('Authorization');
  if (headerToken) return headerToken;

  try {
    const supabase = await getServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return `Bearer ${session.access_token}`;
    }
  } catch {}

  return null;
}

async function resolveUserId(supabaseClient: any): Promise<string | null> {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;
    const { data: userData } = await supabaseClient
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    return userData?.id || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const authHeader = await resolveAuthToken(req);
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse the request body to inject memory context
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { messages, model, conversationId, files } = body;

  // Try to inject memory context into the system prompt
  try {
    const supabase = await getServerSupabase();
    const userId = await resolveUserId(supabase);

    if (userId && messages?.length > 0) {
      const memoryStore = createMemoryStore(userId);

      // Extract memory from the latest user message
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
      if (lastUserMsg?.content) {
        const existingMemory = await memoryStore.getAll();
        const newEntries = extractMemoryFromMessage(lastUserMsg.content, existingMemory);

        // Store extracted memory (fire and forget)
        for (const entry of newEntries) {
          memoryStore.set({
            ...entry,
            userId,
          }).catch(() => {});
        }
      }

      // Build context from stored memory
      const memoryContext = await memoryStore.buildContext();

      if (memoryContext) {
        // Inject into system message
        const systemMsg = messages.find((m: any) => m.role === 'system');
        if (systemMsg) {
          systemMsg.content = `${systemMsg.content}\n\n## User Context\nThe user has the following profile and preferences:\n${memoryContext}\nUse this context to provide personalized responses.`;
        } else {
          messages.unshift({
            role: 'system',
            content: `You are Orin's AI career coach. You help users build their career proof portfolio.\n\n## User Context\nThe user has the following profile and preferences:\n${memoryContext}\nUse this context to provide personalized responses.`,
          });
        }
      }
    }
  } catch (e) {
    // Memory injection is best-effort — don't break the chat
    console.warn('Memory injection failed:', e);
  }

  // Forward to backend with enriched messages
  const headers: Record<string, string> = {
    'Authorization': authHeader,
    'Content-Type': 'application/json',
  };

  try {
    const backendRes = await fetch(`${BACKEND_URL}/ai/chat-stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages, model, conversationId, files }),
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text().catch(() => '');
      let errorData: any;
      try { errorData = JSON.parse(errorText); } catch { errorData = { error: errorText }; }
      return NextResponse.json(
        { error: errorData?.error?.message || errorData?.error || `Backend returned ${backendRes.status}` },
        { status: backendRes.status }
      );
    }

    // Stream the response
    if (backendRes.headers.get('Content-Type')?.includes('text/event-stream')) {
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
    try { responseData = JSON.parse(responseText); } catch { responseData = responseText; }
    return NextResponse.json(responseData, { status: backendRes.status });
  } catch (error) {
    console.error('Chat-stream request failed:', error);
    return NextResponse.json({ error: 'Backend service unavailable' }, { status: 502 });
  }
}
