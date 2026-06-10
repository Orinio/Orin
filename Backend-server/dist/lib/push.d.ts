export declare function configureVapid(): boolean;
export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    url?: string;
    tag?: string;
    type?: string;
    notificationId?: string;
    requireInteraction?: boolean;
    actions?: Array<{
        action: string;
        title: string;
    }>;
}
export declare function sendPushToUser(userId: string, payload: PushPayload): Promise<{
    sent: number;
    failed: number;
}>;
export declare function sendPushToAllActiveUsers(payload: PushPayload, options?: {
    batchSize?: number;
    delayMs?: number;
}): Promise<{
    totalSent: number;
    totalFailed: number;
    usersNotified: number;
}>;
//# sourceMappingURL=push.d.ts.map