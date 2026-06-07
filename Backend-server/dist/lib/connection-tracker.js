"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionTracker = exports.ConnectionTracker = void 0;
const logger_js_1 = require("../lib/logger.js");
/**
 * Connection tracker for graceful shutdown.
 * Tracks active connections and allows draining before force-closing.
 */
class ConnectionTracker {
    connections = new Set();
    track(server) {
        server.on('connection', (conn) => {
            this.connections.add(conn);
            conn.on('close', () => this.connections.delete(conn));
        });
    }
    get activeCount() {
        return this.connections.size;
    }
    async drain(timeoutMs = 10_000) {
        if (this.connections.size === 0) {
            logger_js_1.logger.info('No active connections to drain');
            return;
        }
        logger_js_1.logger.info({ count: this.connections.size }, 'Draining active connections');
        return new Promise((resolve) => {
            const deadline = setTimeout(() => {
                logger_js_1.logger.warn({ remaining: this.connections.size }, 'Connection drain timeout — forcing close');
                for (const conn of this.connections) {
                    try {
                        conn.destroy();
                    }
                    catch { /* already closed */ }
                }
                this.connections.clear();
                resolve();
            }, timeoutMs);
            if (this.connections.size === 0) {
                clearTimeout(deadline);
                resolve();
                return;
            }
            // Wait for connections to close naturally
            const check = setInterval(() => {
                if (this.connections.size === 0) {
                    clearTimeout(deadline);
                    clearInterval(check);
                    logger_js_1.logger.info('All connections drained');
                    resolve();
                }
            }, 100);
        });
    }
}
exports.ConnectionTracker = ConnectionTracker;
exports.connectionTracker = new ConnectionTracker();
//# sourceMappingURL=connection-tracker.js.map