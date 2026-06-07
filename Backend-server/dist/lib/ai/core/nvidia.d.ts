export interface ChatMessage {
    role: string;
    content: string;
}
export interface ChatCompletionOptions {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
}
export interface ChatCompletionResponse {
    id: string;
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export declare function getTokenUsage(): {
    prompt: number;
    completion: number;
    total: number;
    requests: number;
    errors: number;
};
export declare function isNvidiaConfigured(): boolean;
export declare function chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse>;
export declare function chatCompletionStream(options: ChatCompletionOptions): AsyncGenerator<string, void, unknown>;
export declare function generateEmbeddings(text: string, model?: string): Promise<{
    embedding: number[];
    dimensions: number;
    tokensUsed: number;
}>;
//# sourceMappingURL=nvidia.d.ts.map