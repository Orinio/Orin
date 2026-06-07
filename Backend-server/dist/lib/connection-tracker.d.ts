/**
 * Connection tracker for graceful shutdown.
 * Tracks active connections and allows draining before force-closing.
 */
export declare class ConnectionTracker {
    private connections;
    track(server: import('http').Server): void;
    get activeCount(): number;
    drain(timeoutMs?: number): Promise<void>;
}
export declare const connectionTracker: ConnectionTracker;
//# sourceMappingURL=connection-tracker.d.ts.map