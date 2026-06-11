import type { SkillAnalysis } from './skills';
import type { User, Proof } from './types';

export interface CoachPromptContext {
  user: User;
  proofs: Proof[];
  skillAnalysis: SkillAnalysis;
  noteType: 'daily' | 'weekly' | 'milestone' | 'ad_hoc';
  milestone?: string;
  confidenceScore?: number;
  targetRole?: string;
  skillGaps?: Array<{ skill: string; importance: string; actionPlan: string[] }>;
}

// Sanitize user input to prevent prompt injection
function sanitizeForPrompt(input: string | undefined | null): string {
  if (!input) return 'Not specified';
  // Remove potentially dangerous characters and limit length
  return input
    .replace(/[^\w\s.,@'()-]/g, '')
    .slice(0, 200)
    .trim() || 'Not specified';
}

export function buildSystemPrompt(): string {
  return `You are Orin AI Coach, a proof-aware career coach that helps professionals build verified proof portfolios.

Your role is to analyze a professional's proof wallet and provide actionable, specific career advice that helps them:
1. Add new proof cards to their portfolio
2. Verify existing proofs for higher confidence scores
3. Fill skill gaps with concrete projects and activities
4. Share proof cards with recruiters and hiring managers

Guidelines:
- Be encouraging but honest
- Provide specific, actionable advice (not generic platitudes)
- Reference their actual proofs, skills, and verification status
- Focus on concrete next steps that build proof cards
- Keep responses concise (2-4 sentences for tips, 1 paragraph for insights)
- Use a professional but friendly tone
- Always end with a clear call-to-action when applicable
- Adapt advice to their specific profession (tech, medical, education, legal, creative, business, etc.)
- Reference confidence scores when relevant

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

export function buildDailyTipPrompt(context: CoachPromptContext): string {
  const { user, skillAnalysis, proofs, confidenceScore } = context;
  const verifiedCount = proofs.filter((p) => p.verificationStatus === 'verified').length;
  const topSkills = skillAnalysis.topSkills.slice(0, 5).map((s) => s.name).join(', ');
  const gaps = skillAnalysis.skillGaps.slice(0, 3).map((g) => g.skill).join(', ');

  return `Generate a daily career tip for this professional based on their proof wallet.

Professional Profile:
- Name: ${sanitizeForPrompt(user.fullName || user.username)}
- Headline: ${sanitizeForPrompt(user.headline)}
- Location: ${sanitizeForPrompt(user.location)}

Proof Wallet Summary:
- Total proofs: ${proofs.length}
- Verified proofs: ${verifiedCount}
- Verification rate: ${proofs.length > 0 ? Math.round((verifiedCount / proofs.length) * 100) : 0}%
- Confidence score: ${confidenceScore || 'Not calculated'}
- Top skills: ${topSkills || 'None yet'}
- Skill gaps: ${gaps || 'None identified'}

Provide a specific, actionable tip based on their proof wallet. Focus on:
1. One thing they can do TODAY to add a new proof card
2. Reference their actual skills or proofs when possible
3. Keep it concise and actionable
4. Mention how this will improve their confidence score

Respond with JSON only.`;
}

export function buildWeeklyInsightPrompt(context: CoachPromptContext): string {
  const { user, skillAnalysis, proofs, confidenceScore } = context;
  const verifiedCount = proofs.filter((p) => p.verificationStatus === 'verified').length;
  const recentProofs = proofs.slice(0, 5);
  const skillGaps = skillAnalysis.skillGaps.slice(0, 5);

  return `Generate a weekly insight summary for this professional based on their proof wallet.

Professional Profile:
- Name: ${sanitizeForPrompt(user.fullName || user.username)}
- Headline: ${sanitizeForPrompt(user.headline)}
- Location: ${sanitizeForPrompt(user.location)}

This Week's Proof Activity:
- Total proofs: ${proofs.length}
- Verified proofs: ${verifiedCount}
- Verification rate: ${proofs.length > 0 ? Math.round((verifiedCount / proofs.length) * 100) : 0}%
- Confidence score: ${confidenceScore || 'Not calculated'}

Recent Proofs:
${recentProofs.map((p) => `- ${p.title} (${p.sourceType}) [${p.verificationStatus}]`).join('\n') || 'No recent proofs'}

Skill Analysis:
- Total unique skills: ${skillAnalysis.uniqueSkills}
- Average proofs per skill: ${skillAnalysis.averageProofsPerSkill.toFixed(1)}
- Top skills: ${skillAnalysis.topSkills.slice(0, 5).map((s) => `${s.name} (${s.count} proofs)`).join(', ') || 'None'}

Skill Gaps to Address:
${skillGaps.map((g) => `- ${g.skill} (${g.importance})`).join('\n') || 'No gaps identified'}

Provide a comprehensive weekly summary that includes:
1. What proofs they added or verified this week
2. Areas of strength (high-confidence proofs)
3. One specific proof card they should add next
4. How their confidence score changed

Respond with JSON only.`;
}

export function buildMilestonePrompt(context: CoachPromptContext): string {
  const { user, skillAnalysis, proofs, milestone, confidenceScore } = context;
  const verifiedCount = proofs.filter((p) => p.verificationStatus === 'verified').length;

  return `Generate a milestone celebration note for this professional.

Professional Profile:
- Name: ${sanitizeForPrompt(user.fullName || user.username)}
- Headline: ${sanitizeForPrompt(user.headline)}

Milestone Achieved: ${sanitizeForPrompt(milestone) || 'New milestone reached'}

Proof Wallet Stats:
- Total proofs: ${proofs.length}
- Verified proofs: ${verifiedCount}
- Unique skills: ${skillAnalysis.uniqueSkills}
- Verification rate: ${proofs.length > 0 ? Math.round((verifiedCount / proofs.length) * 100) : 0}%
- Confidence score: ${confidenceScore || 'Not calculated'}

Celebrate their achievement and:
1. Acknowledge their specific accomplishment
2. Put it in context of their proof portfolio growth
3. Suggest what proof card to add next
4. Keep it enthusiastic but professional

Respond with JSON only.`;
}

export function buildAdHocPrompt(
  context: CoachPromptContext,
  userQuery?: string
): string {
  const { user, skillAnalysis, proofs, confidenceScore, targetRole, skillGaps } = context;
  const verifiedCount = proofs.filter((p) => p.verificationStatus === 'verified').length;
  const topSkills = skillAnalysis.topSkills.slice(0, 5).map((s) => s.name).join(', ');

  return `A professional is asking for career advice. Provide personalized guidance based on their proof wallet.

Professional Profile:
- Name: ${sanitizeForPrompt(user.fullName || user.username)}
- Headline: ${sanitizeForPrompt(user.headline)}
- Location: ${sanitizeForPrompt(user.location)}

Proof Wallet Summary:
- Total proofs: ${proofs.length}
- Verified proofs: ${verifiedCount}
- Top skills: ${topSkills || 'None yet'}
- Verification rate: ${proofs.length > 0 ? Math.round((verifiedCount / proofs.length) * 100) : 0}%
- Confidence score: ${confidenceScore || 'Not calculated'}
- Target role: ${targetRole || 'Not specified'}

Skill Gaps:
${skillGaps?.map((g) => `- ${g.skill} (${g.importance})`).join('\n') || skillAnalysis.skillGaps.slice(0, 5).map((g) => `- ${g.skill} (${g.importance})`).join('\n') || 'No gaps identified'}

  ${userQuery ? `User's question: "${sanitizeForPrompt(userQuery)}"` : 'Provide general career advice based on their proof wallet.'}

Provide personalized advice that:
1. References their actual proofs and verification status
2. Addresses their specific question or situation
3. Gives concrete next steps to add new proof cards
4. Explains how this will improve their confidence score
5. Is encouraging but realistic

Respond with JSON only.`;
}

export function buildOnboardingPrompt(context: CoachPromptContext): string {
  const { user } = context;

  return `Generate an onboarding welcome note for a new professional joining Orin.

Professional Profile:
- Name: ${sanitizeForPrompt(user.fullName || user.username)}
- Headline: ${sanitizeForPrompt(user.headline)}
- Location: ${sanitizeForPrompt(user.location)}

This is their first interaction with the AI coach. Welcome them and:
1. Acknowledge their decision to join Orin
2. Explain the proof wallet concept (verified proof cards)
3. Suggest their first action (connecting platforms or adding a proof)
4. Keep it warm, welcoming, and motivating

Respond with JSON only.`;
}

export function getPromptForNoteType(
  context: CoachPromptContext,
  userQuery?: string
): string {
  switch (context.noteType) {
    case 'daily':
      return buildDailyTipPrompt(context);
    case 'weekly':
      return buildWeeklyInsightPrompt(context);
    case 'milestone':
      return buildMilestonePrompt(context);
    case 'ad_hoc':
      return buildAdHocPrompt(context, userQuery);
    default:
      return buildDailyTipPrompt(context);
  }
}

export function parseCoachResponse(response: string): {
  content: string;
  actionLabel?: string;
  actionUrl?: string;
  priority: number;
} | null {
  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
    
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        content: cleaned,
        priority: 5,
      };
    }
    
    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.content || typeof parsed.content !== 'string') {
      return null;
    }

    return {
      content: parsed.content,
      actionLabel: parsed.actionLabel || undefined,
      actionUrl: parsed.actionUrl || undefined,
      priority: typeof parsed.priority === 'number' ? parsed.priority : 5,
    };
  } catch {
    return null;
  }
}
