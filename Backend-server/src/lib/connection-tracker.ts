import { logger } from '../lib/logger.js';

/**
 * Connection tracker for graceful shutdown.
 * Tracks active connections and allows draining before force-closing.
 */

export class ConnectionTracker {
  private connections = new Set<any>();

  track(server: import('http').Server): void {
    server.on('connection', (conn) => {
      this.connections.add(conn);
      conn.on('close', () => this.connections.delete(conn));
    });
  }

  get activeCount(): number {
    return this.connections.size;
  }

  async drain(timeoutMs: number = 10_000): Promise<void> {
    if (this.connections.size === 0) {
      logger.info('No active connections to drain');
      return;
    }

    logger.info({ count: this.connections.size }, 'Draining active connections');

    return new Promise((resolve) => {
      const deadline = setTimeout(() => {
        logger.warn({ remaining: this.connections.size }, 'Connection drain timeout — forcing close');
        for (const conn of this.connections) {
          try { conn.destroy(); } catch { /* already closed */ }
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
          logger.info('All connections drained');
          resolve();
        }
      }, 100);
    });
  }
}

export const connectionTracker = new ConnectionTracker();
