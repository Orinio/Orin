import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CoachRequest {
  userId: string;
  noteType: "daily" | "weekly" | "milestone" | "ad_hoc";
  milestone?: string;
  userQuery?: string;
}

interface CoachNote {
  content: string;
  actionLabel?: string;
  actionUrl?: string;
  priority: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const nvidiaApiKey = Deno.env.get("NVIDIA_API_KEY")!;

    if (!nvidiaApiKey) {
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

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !userProfile) {
      throw new Error("User profile not found");
    }

    const requestBody: CoachRequest = await req.json();
    const { userId, noteType, milestone, userQuery } = requestBody;

    if (userId !== userProfile.id) {
      throw new Error("User ID mismatch");
    }

    const { data: proofs, error: proofsError } = await supabase
      .from("proof_cards")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (proofsError) {
      throw new Error("Failed to fetch proofs");
    }

    const skillAnalysis = analyzeSkillsFromDB(proofs || []);

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildPromptForType(
      noteType,
      userProfile,
      proofs || [],
      skillAnalysis,
      milestone,
      userQuery
    );

    const nvidiaResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${nvidiaApiKey}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!nvidiaResponse.ok) {
      const errorData = await nvidiaResponse.text();
      console.error("NVIDIA NIM API error:", errorData);
      throw new Error("Failed to generate coaching note");
    }

    const nvidiaData = await nvidiaResponse.json();
    const aiContent = nvidiaData.choices[0]?.message?.content;

    if (!aiContent) {
      throw new Error("Empty response from NVIDIA NIM");
    }

    let coachNote: CoachNote;
    try {
      const cleaned = aiContent.replace(/```json\n?|\n?```/g, "").trim();
      coachNote = JSON.parse(cleaned);
    } catch {
      coachNote = {
        content: aiContent,
        priority: 5,
      };
    }

    if (!coachNote.content || typeof coachNote.content !== "string") {
      throw new Error("Invalid coach note format");
    }

    const { data: savedNote, error: saveError } = await supabase
      .from("coach_notes")
      .insert({
        user_id: userId,
        type: noteType,
        content: coachNote.content,
        action_label: coachNote.actionLabel || null,
        action_url: coachNote.actionUrl || null,
        priority: coachNote.priority || 5,
        expires_at:
          noteType === "daily"
            ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            : noteType === "weekly"
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            : null,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Failed to save coach note:", saveError);
      throw new Error("Failed to save coach note");
    }

    return new Response(
      JSON.stringify({
        success: true,
        note: savedNote,
        usage: {
          model: "meta/llama-3.3-70b-instruct",
          tokensUsed: nvidiaData.usage?.total_tokens || 0,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("AI Coach error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function analyzeSkillsFromDB(proofs: any[]) {
  const skillCounts = new Map<string, number>();
  const skillTrends = new Map<string, { recent: number; older: number }>();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  proofs.forEach((proof) => {
    const allSkills = [
      ...(proof.skills_extracted || []),
      ...(proof.skills_user_added || []),
    ];
    const proofDate = new Date(proof.created_at);
    const isRecent = proofDate >= thirtyDaysAgo;

    allSkills.forEach((skill: string) => {
      const normalized = skill.toLowerCase().trim();
      skillCounts.set(normalized, (skillCounts.get(normalized) || 0) + 1);

      const trend = skillTrends.get(normalized) || { recent: 0, older: 0 };
      if (isRecent) {
        trend.recent++;
      } else {
        trend.older++;
      }
      skillTrends.set(normalized, trend);
    });
  });

  const skills = Array.from(skillCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      depth: count <= 1 ? "surface" : count <= 3 ? "moderate" : "deep",
      trend:
        (skillTrends.get(name)?.recent || 0) >
        (skillTrends.get(name)?.older || 0)
          ? "improving"
          : (skillTrends.get(name)?.recent || 0) <
            (skillTrends.get(name)?.older || 0)
          ? "declining"
          : "stable",
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalSkills: Array.from(skillCounts.values()).reduce((a, b) => a + b, 0),
    uniqueSkills: skillCounts.size,
    skills,
    topSkills: skills.slice(0, 10),
  };
}

function buildSystemPrompt(): string {
  return `You are Orin AI Coach, a personalized career coach for students and early-career developers.

Your role is to analyze a developer's proof portfolio and provide actionable, specific career advice.

Guidelines:
- Be encouraging but honest
- Provide specific, actionable advice (not generic platitudes)
- Reference their actual work and skills
- Focus on concrete next steps
- Keep responses concise (2-4 sentences for tips, 1 paragraph for insights)
- Use a professional but friendly tone
- Always end with a clear call-to-action when applicable

Response Format:
You MUST respond with valid JSON in this exact format:
{
  "content": "Your coaching advice here",
  "actionLabel": "Optional CTA button text",
  "actionUrl": "Optional relevant URL",
  "priority": 5
}

Priority scale: -10 (lowest) to 10 (highest)
- Daily tips: priority 3-5
- Weekly insights: priority 5-7
- Milestone celebrations: priority 7-9
- Ad-hoc requests: priority 4-6`;
}

function buildPromptForType(
  noteType: string,
  user: any,
  proofs: any[],
  skillAnalysis: any,
  milestone?: string,
  userQuery?: string
): string {
  const verifiedCount = proofs.filter(
    (p) => p.verification_status === "verified"
  ).length;
  const topSkills = skillAnalysis.topSkills
    .slice(0, 5)
    .map((s: any) => s.name)
    .join(", ");
  const gaps = skillAnalysis.skills
    .filter((s: any) => s.trend === "declining")
    .slice(0, 3)
    .map((s: any) => s.name)
    .join(", ");

  const profileInfo = `
Developer Profile:
- Name: ${user.full_name || user.username}
- College: ${user.college || "Not specified"}
- Year: ${user.year || "Not specified"}

Portfolio Summary:
- Total proofs: ${proofs.length}
- Verified proofs: ${verifiedCount}
- Top skills: ${topSkills || "None yet"}
- Declining skills: ${gaps || "None identified"}`;

  switch (noteType) {
    case "daily":
      return `Generate a daily career tip for this developer.${profileInfo}

Provide a specific, actionable tip based on their current portfolio. Focus on:
1. One thing they can do TODAY to improve their profile
2. Reference their actual skills or proofs when possible
3. Keep it concise and actionable

Respond with JSON only.`;

    case "weekly":
      return `Generate a weekly insight summary for this developer.${profileInfo}

This Week's Activity:
- Total proofs: ${proofs.length}
- Verified proofs: ${verifiedCount}
- Verification rate: ${Math.round(skillAnalysis.verificationRate * 100)}%

Recent Proofs:
${proofs
  .slice(0, 5)
  .map((p: any) => `- ${p.title} (${p.source_type})`)
  .join("\n") || "No recent proofs"}

Provide a comprehensive weekly summary that includes:
1. What they accomplished this week
2. Areas of strength
3. One specific improvement suggestion
4. A motivational insight

Respond with JSON only.`;

    case "milestone":
      return `Generate a milestone celebration note for this developer.${profileInfo}

Milestone Achieved: ${milestone || "New milestone reached"}

Celebrate their achievement and:
1. Acknowledge their specific accomplishment
2. Put it in context of their overall journey
3. Suggest what to aim for next
4. Keep it enthusiastic but professional

Respond with JSON only.`;

    case "ad_hoc":
      return `A developer is asking for career advice. Provide personalized guidance based on their portfolio.${profileInfo}

${userQuery ? `User's question: "${userQuery}"` : "Provide general career advice based on their profile."}

Provide personalized advice that:
1. References their actual skills and proofs
2. Addresses their specific question or situation
3. Gives concrete, actionable next steps
4. Is encouraging but realistic

Respond with JSON only.`;

    default:
      return `Generate a career tip for this developer.${profileInfo}

Respond with JSON only.`;
  }
}
