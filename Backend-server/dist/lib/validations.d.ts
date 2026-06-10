import { z } from 'zod';
export declare const emailSchema: z.ZodString;
export declare const usernameSchema: z.ZodString;
export declare const uuidSchema: z.ZodString;
export declare const urlSchema: z.ZodString;
export declare const signInSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const signUpSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    fullName?: string | undefined;
    username?: string | undefined;
}, {
    email: string;
    password: string;
    fullName?: string | undefined;
    username?: string | undefined;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const updateUserProfileSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    headline: z.ZodOptional<z.ZodString>;
    college: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodEnum<["first", "second", "third", "fourth", "graduate"]>>;
    location: z.ZodOptional<z.ZodString>;
    websiteUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    githubUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    linkedinUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    twitterUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fullName?: string | undefined;
    username?: string | undefined;
    bio?: string | undefined;
    headline?: string | undefined;
    college?: string | undefined;
    year?: "first" | "second" | "third" | "fourth" | "graduate" | undefined;
    location?: string | undefined;
    websiteUrl?: string | null | undefined;
    githubUrl?: string | null | undefined;
    linkedinUrl?: string | null | undefined;
    twitterUrl?: string | null | undefined;
}, {
    fullName?: string | undefined;
    username?: string | undefined;
    bio?: string | undefined;
    headline?: string | undefined;
    college?: string | undefined;
    year?: "first" | "second" | "third" | "fourth" | "graduate" | undefined;
    location?: string | undefined;
    websiteUrl?: string | null | undefined;
    githubUrl?: string | null | undefined;
    linkedinUrl?: string | null | undefined;
    twitterUrl?: string | null | undefined;
}>;
export declare const proofSourceType: z.ZodEnum<["github", "kaggle", "certificate", "hackathon", "project", "blog", "demo", "other"]>;
export declare const createProofSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    sourceType: z.ZodEnum<["github", "kaggle", "certificate", "hackathon", "project", "blog", "demo", "other"]>;
    sourceUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    skillsExtracted: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    skillsUserAdded: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    whatItProves: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    visibility: z.ZodOptional<z.ZodEnum<["private", "unlisted", "public"]>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    sourceType: "github" | "kaggle" | "certificate" | "hackathon" | "project" | "blog" | "demo" | "other";
    description?: string | undefined;
    sourceUrl?: string | null | undefined;
    skillsExtracted?: string[] | undefined;
    skillsUserAdded?: string[] | undefined;
    whatItProves?: string[] | undefined;
    visibility?: "public" | "private" | "unlisted" | undefined;
}, {
    title: string;
    sourceType: "github" | "kaggle" | "certificate" | "hackathon" | "project" | "blog" | "demo" | "other";
    description?: string | undefined;
    sourceUrl?: string | null | undefined;
    skillsExtracted?: string[] | undefined;
    skillsUserAdded?: string[] | undefined;
    whatItProves?: string[] | undefined;
    visibility?: "public" | "private" | "unlisted" | undefined;
}>;
export declare const updateProofSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sourceType: z.ZodOptional<z.ZodEnum<["github", "kaggle", "certificate", "hackathon", "project", "blog", "demo", "other"]>>;
    sourceUrl: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    skillsExtracted: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    skillsUserAdded: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    whatItProves: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    visibility: z.ZodOptional<z.ZodOptional<z.ZodEnum<["private", "unlisted", "public"]>>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    sourceType?: "github" | "kaggle" | "certificate" | "hackathon" | "project" | "blog" | "demo" | "other" | undefined;
    sourceUrl?: string | null | undefined;
    skillsExtracted?: string[] | undefined;
    skillsUserAdded?: string[] | undefined;
    whatItProves?: string[] | undefined;
    visibility?: "public" | "private" | "unlisted" | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    sourceType?: "github" | "kaggle" | "certificate" | "hackathon" | "project" | "blog" | "demo" | "other" | undefined;
    sourceUrl?: string | null | undefined;
    skillsExtracted?: string[] | undefined;
    skillsUserAdded?: string[] | undefined;
    whatItProves?: string[] | undefined;
    visibility?: "public" | "private" | "unlisted" | undefined;
}>;
export declare const opportunityType: z.ZodEnum<["internship", "job", "scholarship", "mentorship", "hackathon", "research", "other"]>;
export declare const getOpportunitiesSchema: z.ZodObject<{
    company: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["internship", "job", "scholarship", "mentorship", "hackathon", "research", "other"]>>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    type?: "hackathon" | "other" | "internship" | "job" | "scholarship" | "mentorship" | "research" | undefined;
    search?: string | undefined;
    company?: string | undefined;
}, {
    type?: "hackathon" | "other" | "internship" | "job" | "scholarship" | "mentorship" | "research" | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    company?: string | undefined;
    page?: number | undefined;
}>;
export declare const chatMessageSchema: z.ZodObject<{
    message: z.ZodString;
    history: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
        role: "user" | "assistant";
    }, {
        content: string;
        role: "user" | "assistant";
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    history: {
        content: string;
        role: "user" | "assistant";
    }[];
}, {
    message: string;
    history?: {
        content: string;
        role: "user" | "assistant";
    }[] | undefined;
}>;
export declare const verifyActionSchema: z.ZodEnum<["verify", "analyze", "extract_skills", "check_safety", "analyze_github", "custom"]>;
export declare const verifyRequestSchema: z.ZodObject<{
    action: z.ZodEnum<["verify", "analyze", "extract_skills", "check_safety", "analyze_github", "custom"]>;
    proofId: z.ZodOptional<z.ZodString>;
    proofUrl: z.ZodOptional<z.ZodString>;
    sourceType: z.ZodOptional<z.ZodEnum<["github", "kaggle", "certificate", "hackathon", "project", "blog", "demo", "other"]>>;
    proofData: z.ZodOptional<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        sourceType: z.ZodEnum<["github", "kaggle", "certificate", "hackathon", "project", "blog", "demo", "other"]>;
        sourceUrl: z.ZodOptional<z.ZodString>;
        skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        whatItProves: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        sourceType: "github" | "kaggle" | "certificate" | "hackathon" | "project" | "blog" | "demo" | "other";
        metadata?: Record<string, unknown> | undefined;
        skills?: string[] | undefined;
        description?: string | undefined;
        sourceUrl?: string | undefined;
        whatItProves?: string[] | undefined;
    }, {
        title: string;
        sourceType: "github" | "kaggle" | "certificate" | "hackathon" | "project" | "blog" | "demo" | "other";
        metadata?: Record<string, unknown> | undefined;
        skills?: string[] | undefined;
        description?: string | undefined;
        sourceUrl?: string | undefined;
        whatItProves?: string[] | undefined;
    }>>;
    text: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    query: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "custom" | "extract_skills" | "verify" | "analyze" | "check_safety" | "analyze_github";
    url?: string | undefined;
    text?: string | undefined;
    query?: string | undefined;
    username?: string | undefined;
    sourceType?: "github" | "kaggle" | "certificate" | "hackathon" | "project" | "blog" | "demo" | "other" | undefined;
    proofId?: string | undefined;
    proofUrl?: string | undefined;
    proofData?: {
        title: string;
        sourceType: "github" | "kaggle" | "certificate" | "hackathon" | "project" | "blog" | "demo" | "other";
        metadata?: Record<string, unknown> | undefined;
        skills?: string[] | undefined;
        description?: string | undefined;
        sourceUrl?: string | undefined;
        whatItProves?: string[] | undefined;
    } | undefined;
}, {
    action: "custom" | "extract_skills" | "verify" | "analyze" | "check_safety" | "analyze_github";
    url?: string | undefined;
    text?: string | undefined;
    query?: string | undefined;
    username?: string | undefined;
    sourceType?: "github" | "kaggle" | "certificate" | "hackathon" | "project" | "blog" | "demo" | "other" | undefined;
    proofId?: string | undefined;
    proofUrl?: string | undefined;
    proofData?: {
        title: string;
        sourceType: "github" | "kaggle" | "certificate" | "hackathon" | "project" | "blog" | "demo" | "other";
        metadata?: Record<string, unknown> | undefined;
        skills?: string[] | undefined;
        description?: string | undefined;
        sourceUrl?: string | undefined;
        whatItProves?: string[] | undefined;
    } | undefined;
}>;
export declare const coachNoteType: z.ZodEnum<["daily", "weekly", "milestone", "ad_hoc"]>;
export declare const generateCoachNoteSchema: z.ZodObject<{
    noteType: z.ZodEnum<["daily", "weekly", "milestone", "ad_hoc"]>;
    milestone: z.ZodOptional<z.ZodString>;
    userQuery: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    noteType: "daily" | "weekly" | "milestone" | "ad_hoc";
    milestone?: string | undefined;
    userQuery?: string | undefined;
}, {
    noteType: "daily" | "weekly" | "milestone" | "ad_hoc";
    milestone?: string | undefined;
    userQuery?: string | undefined;
}>;
export declare const matchOpportunitiesSchema: z.ZodObject<{
    userId: z.ZodString;
    targetRole: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    includeSkillGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    limit: number;
    includeSkillGaps: boolean;
    targetRole?: string | undefined;
}, {
    userId: string;
    limit?: number | undefined;
    targetRole?: string | undefined;
    includeSkillGaps?: boolean | undefined;
}>;
export declare const learningPathSchema: z.ZodObject<{
    targetRole: z.ZodOptional<z.ZodString>;
    timeframe: z.ZodDefault<z.ZodOptional<z.ZodEnum<["1month", "3months", "6months", "1year"]>>>;
    focusAreas: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    timeframe: "1month" | "3months" | "6months" | "1year";
    focusAreas: string[];
    targetRole?: string | undefined;
}, {
    targetRole?: string | undefined;
    timeframe?: "1month" | "3months" | "6months" | "1year" | undefined;
    focusAreas?: string[] | undefined;
}>;
export declare const chatStreamSchema: z.ZodObject<{
    message: z.ZodString;
    history: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
        role: "user" | "assistant";
    }, {
        content: string;
        role: "user" | "assistant";
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    history: {
        content: string;
        role: "user" | "assistant";
    }[];
}, {
    message: string;
    history?: {
        content: string;
        role: "user" | "assistant";
    }[] | undefined;
}>;
export declare const matchRequestSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
}, {
    limit?: number | undefined;
}>;
export declare const safetyCheckSchema: z.ZodObject<{
    url: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    url?: string | undefined;
    email?: string | undefined;
}, {
    url?: string | undefined;
    email?: string | undefined;
}>;
export declare function validateRequest<T extends z.ZodType>(schema: T, data: unknown): {
    success: true;
    data: z.infer<T>;
} | {
    success: false;
    error: string;
};
//# sourceMappingURL=validations.d.ts.map