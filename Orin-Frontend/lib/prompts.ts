import type { SkillAnalysis } from './skills';
import type { User, Proof } from './types';

export interface CoachPromptContext {
  user: User;
  proofs: Proof[];
  skillAnalysis: SkillAnalysis;
  noteType: 'daily' | 'weekly' | 'milestone' | 'ad_hoc';
  milestone?: string;
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

export function buildDailyTipPrompt(context: CoachPromptContext): string {
  const { user, skillAnalysis, proofs } = context;
  const verifiedCount = proofs.filter((p) => p.verificationStatus === 'verified').length;
  const topSkills = skillAnalysis.topSkills.slice(0, 5).map((s) => s.name).join(', ');
  const gaps = skillAnalysis.skillGaps.slice(0, 3).map((g) => g.skill).join(', ');

  return `Generate a daily career tip for this developer.

Developer Profile:
- Name: ${sanitizeForPrompt(user.fullName || user.username)}
- College: ${sanitizeForPrompt(user.college)}
- Year: ${sanitizeForPrompt(user.year)}

Portfolio Summary:
- Total proofs: ${proofs.length}
- Verified proofs: ${verifiedCount}
- Top skills: ${topSkills || 'None yet'}
- Skill gaps: ${gaps || 'None identified'}

Provide a specific, actionable tip based on their current portfolio. Focus on:
1. One thing they can do TODAY to improve their profile
2. Reference their actual skills or proofs when possible
3. Keep it concise and actionable

Respond with JSON only.`;
}

export function buildWeeklyInsightPrompt(context: CoachPromptContext): string {
  const { user, skillAnalysis, proofs } = context;
  const verifiedCount = proofs.filter((p) => p.verificationStatus === 'verified').length;
  const recentProofs = proofs.slice(0, 5);
  const skillGaps = skillAnalysis.skillGaps.slice(0, 5);

  return `Generate a weekly insight summary for this developer.

Developer Profile:
- Name: ${sanitizeForPrompt(user.fullName || user.username)}
- College: ${sanitizeForPrompt(user.college)}
- Year: ${sanitizeForPrompt(user.year)}

This Week's Activity:
- Total proofs: ${proofs.length}
- Verified proofs: ${verifiedCount}
- Verification rate: ${Math.round(skillAnalysis.verificationRate * 100)}%

Recent Proofs:
${recentProofs.map((p) => `- ${p.title} (${p.sourceType})`).join('\n') || 'No recent proofs'}

Skill Analysis:
- Total unique skills: ${skillAnalysis.uniqueSkills}
- Average proofs per skill: ${skillAnalysis.averageProofsPerSkill.toFixed(1)}
- Top skills: ${skillAnalysis.topSkills.slice(0, 5).map((s) => `${s.name} (${s.count} proofs)`).join(', ') || 'None'}

Skill Gaps to Address:
${skillGaps.map((g) => `- ${g.skill} (${g.importance})`).join('\n') || 'No gaps identified'}

Provide a comprehensive weekly summary that includes:
1. What they accomplished this week
2. Areas of strength
3. One specific improvement suggestion
4. A motivational insight

Respond with JSON only.`;
}

export function buildMilestonePrompt(context: CoachPromptContext): string {
  const { user, skillAnalysis, proofs, milestone } = context;
  const verifiedCount = proofs.filter((p) => p.verificationStatus === 'verified').length;

  return `Generate a milestone celebration note for this developer.

Developer Profile:
- Name: ${sanitizeForPrompt(user.fullName || user.username)}
- College: ${sanitizeForPrompt(user.college)}

Milestone Achieved: ${sanitizeForPrompt(milestone) || 'New milestone reached'}

Portfolio Stats:
- Total proofs: ${proofs.length}
- Verified proofs: ${verifiedCount}
- Unique skills: ${skillAnalysis.uniqueSkills}
- Verification rate: ${Math.round(skillAnalysis.verificationRate * 100)}%

Celebrate their achievement and:
1. Acknowledge their specific accomplishment
2. Put it in context of their overall journey
3. Suggest what to aim for next
4. Keep it enthusiastic but professional

Respond with JSON only.`;
}

export function buildAdHocPrompt(
  context: CoachPromptContext,
  userQuery?: string
): string {
  const { user, skillAnalysis, proofs } = context;
  const verifiedCount = proofs.filter((p) => p.verificationStatus === 'verified').length;
  const topSkills = skillAnalysis.topSkills.slice(0, 5).map((s) => s.name).join(', ');
  const skillGaps = skillAnalysis.skillGaps.slice(0, 5);

  return `A developer is asking for career advice. Provide personalized guidance based on their portfolio.

Developer Profile:
- Name: ${sanitizeForPrompt(user.fullName || user.username)}
- College: ${sanitizeForPrompt(user.college)}
- Year: ${sanitizeForPrompt(user.year)}

Portfolio Summary:
- Total proofs: ${proofs.length}
- Verified proofs: ${verifiedCount}
- Top skills: ${topSkills || 'None yet'}
- Verification rate: ${Math.round(skillAnalysis.verificationRate * 100)}%

Skill Gaps:
${skillGaps.map((g) => `- ${g.skill} (${g.importance})`).join('\n') || 'No gaps identified'}

  ${userQuery ? `User's question: "${sanitizeForPrompt(userQuery)}"` : 'Provide general career advice based on their profile.'}

Provide personalized advice that:
1. References their actual skills and proofs
2. Addresses their specific question or situation
3. Gives concrete, actionable next steps
4. Is encouraging but realistic

Respond with JSON only.`;
}

export function buildOnboardingPrompt(context: CoachPromptContext): string {
  const { user } = context;

  return `Generate an onboarding welcome note for a new developer joining Orin.

Developer Profile:
- Name: ${sanitizeForPrompt(user.fullName || user.username)}
- College: ${sanitizeForPrompt(user.college)}
- Year: ${sanitizeForPrompt(user.year)}

This is their first interaction with the AI coach. Welcome them and:
1. Acknowledge their decision to join Orin
2. Highlight the key features they should explore
3. Suggest their first action (connecting GitHub or adding a proof)
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
