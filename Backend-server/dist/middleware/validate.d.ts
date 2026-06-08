import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
export declare const chatQuerySchema: z.ZodObject<{
    query: z.ZodString;
    conversationHistory: z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant", "system"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
        role: "user" | "system" | "assistant";
    }, {
        content: string;
        role: "user" | "system" | "assistant";
    }>, "many">>;
    agentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    query: string;
    agentId?: string | undefined;
    conversationHistory?: {
        content: string;
        role: "user" | "system" | "assistant";
    }[] | undefined;
}, {
    query: string;
    agentId?: string | undefined;
    conversationHistory?: {
        content: string;
        role: "user" | "system" | "assistant";
    }[] | undefined;
}>;
export declare const streamChatSchema: z.ZodObject<{
    query: z.ZodString;
    conversationHistory: z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant", "system"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
        role: "user" | "system" | "assistant";
    }, {
        content: string;
        role: "user" | "system" | "assistant";
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    query: string;
    conversationHistory?: {
        content: string;
        role: "user" | "system" | "assistant";
    }[] | undefined;
}, {
    query: string;
    conversationHistory?: {
        content: string;
        role: "user" | "system" | "assistant";
    }[] | undefined;
}>;
export declare const verifySchema: z.ZodObject<{
    action: z.ZodEnum<["verify", "analyze", "extract_skills", "safety_check", "analyze_github", "custom"]>;
    url: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    proofData: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    action: "custom" | "extract_skills" | "verify" | "analyze" | "analyze_github" | "safety_check";
    url?: string | undefined;
    text?: string | undefined;
    proofData?: any;
}, {
    action: "custom" | "extract_skills" | "verify" | "analyze" | "analyze_github" | "safety_check";
    url?: string | undefined;
    text?: string | undefined;
    proofData?: any;
}>;
export declare const skillsSchema: z.ZodObject<{
    text: z.ZodOptional<z.ZodString>;
    targetRole: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text?: string | undefined;
    targetRole?: string | undefined;
}, {
    text?: string | undefined;
    targetRole?: string | undefined;
}>;
export declare const matchSchema: z.ZodObject<{
    userSkills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    opportunityId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userSkills?: string[] | undefined;
    opportunityId?: string | undefined;
}, {
    userSkills?: string[] | undefined;
    opportunityId?: string | undefined;
}>;
export declare const learningPathSchema: z.ZodObject<{
    currentSkills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    targetRole: z.ZodString;
    timeframe: z.ZodOptional<z.ZodEnum<["3months", "6months", "1year"]>>;
}, "strip", z.ZodTypeAny, {
    targetRole: string;
    timeframe?: "3months" | "6months" | "1year" | undefined;
    currentSkills?: string[] | undefined;
}, {
    targetRole: string;
    timeframe?: "3months" | "6months" | "1year" | undefined;
    currentSkills?: string[] | undefined;
}>;
export declare const scoreSchema: z.ZodObject<{
    portfolioData: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    portfolioData?: any;
}, {
    portfolioData?: any;
}>;
export declare function validate(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.d.ts.map