import type { SkillAnalysis } from './skills';
import type { User, Proof } from './types';
export interface CoachPromptContext {
    user: User;
    proofs: Proof[];
    skillAnalysis: SkillAnalysis;
    noteType: 'daily' | 'weekly' | 'milestone' | 'ad_hoc';
    milestone?: string;
}
export declare function buildSystemPrompt(): string;
export declare function buildDailyTipPrompt(context: CoachPromptContext): string;
export declare function buildWeeklyInsightPrompt(context: CoachPromptContext): string;
export declare function buildMilestonePrompt(context: CoachPromptContext): string;
export declare function buildAdHocPrompt(context: CoachPromptContext, userQuery?: string): string;
export declare function buildOnboardingPrompt(context: CoachPromptContext): string;
export declare function getPromptForNoteType(context: CoachPromptContext, userQuery?: string): string;
export declare function parseCoachResponse(response: string): {
    content: string;
    actionLabel?: string;
    actionUrl?: string;
    priority: number;
} | null;
//# sourceMappingURL=prompts.d.ts.map