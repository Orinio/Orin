import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NVIDIA_API_KEY = Deno.env.get("NVIDIA_API_KEY")!;
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

const TOOLS = [
  {
    name: 'verify_github',
    description: 'Verify if a GitHub repository exists and get its details',
    parameters: { url: 'string' }
  },
  {
    name: 'verify_certificate',
    description: 'Verify if a certificate URL is valid and exists',
    parameters: { url: 'string' }
  },
  {
    name: 'check_kaggle',
    description: 'Check if a Kaggle notebook/dataset exists',
    parameters: { url: 'string' }
  }
];

function buildToolSystemPrompt(): string {
  return `You are an AI agent with tool access for proof verification. ONLY respond with valid JSON.

Tool use format:
{"thinking":"reasoning","tool_call":{"name":"tool_name","arguments":{"url":"value"}}}

Final answer format:
{"thinking":"reasoning","answer":"your answer"}

Available tools:
- verify_github(url): Verify GitHub repository exists
- verify_certificate(url): Verify certificate URL is valid
- check_kaggle(url): Check Kaggle notebook/dataset exists

RULES:
1. Always use tools to verify proofs
2. Respond with valid JSON only
3. Be concise and factual`;
}

async function executeTool(name: string, args: Record<string, string>): Promise<any> {
  switch (name) {
    case 'verify_github': {
      const url = args.url;
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) return { success: false, error: 'Invalid GitHub URL' };
      const [, owner, repo] = match;
      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo.replace('.git', '')}`, {
          headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        if (!res.ok) return { exists: false, status: res.status };
        const data = await res.json();
        return { exists: true, name: data.full_name, stars: data.stargazers_count, language: data.language };
      } catch (e) {
        return { exists: false, error: e.message };
      }
    }
    case 'verify_certificate': {
      try {
        const res = await fetch(args.url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) });
        return { exists: res.ok, status: res.status };
      } catch (e) {
        return { exists: false, error: e.message };
      }
    }
    case 'check_kaggle': {
      try {
        const res = await fetch(args.url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) });
        return { exists: res.ok, status: res.status };
      } catch (e) {
        return { exists: false, error: e.message };
      }
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!NVIDIA_API_KEY) {
      throw new Error("NVIDIA_API_KEY not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const requestBody = await req.json();
    const { userId, proofUrl, sourceType } = requestBody;

    const { data: userProfile } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: buildToolSystemPrompt() },
      { role: "user", content: `Verify this ${sourceType} proof: ${proofUrl}. Use the appropriate tool.` }
    ];

    let finalAnswer = "";
    let toolCalls: any[] = [];
    let iterations = 0;

    while (iterations < 3) {
      iterations++;
      
      const nvidiaResponse = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          model: "meta/llama-3.1-8b-instruct",
          messages,
          temperature: 0.3,
          max_tokens: 300,
        }),
      });

      if (!nvidiaResponse.ok) {
        throw new Error("Failed to get AI response");
      }

      const nvidiaData = await nvidiaResponse.json();
      const content = nvidiaData.choices[0]?.message?.content || "";

      let parsed: any;
      try {
        const cleaned = content.replace(/[\r\n\t]/g, " ").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON");
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        finalAnswer = content;
        break;
      }

      if (parsed.answer) {
        finalAnswer = parsed.answer;
        break;
      }

      if (parsed.tool_call) {
        const result = await executeTool(parsed.tool_call.name, parsed.tool_call.arguments);
        toolCalls.push({ tool: parsed.tool_call.name, args: parsed.tool_call.arguments, result });

        messages.push({ role: "assistant", content: JSON.stringify({ tool_call: parsed.tool_call }) });
        messages.push({ role: "user", content: `Tool result: ${JSON.stringify(result)}` });
      }
    }

    const verified = toolCalls.some(tc => tc.result?.exists === true);

    return new Response(
      JSON.stringify({
        success: true,
        verified,
        thinking: "Agent verified the proof using tools",
        toolCalls,
        answer: finalAnswer,
        iterations,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Agent error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
