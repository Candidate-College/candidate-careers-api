/**
 * SSE Stream Utility
 *
 * Simplifies creation of Server-Sent Events (SSE) streams for Express routes.
 * It maintains a registry of connected clients and exposes helpers to broadcast
 * JSON payloads.  Designed to integrate with `ActivityMonitoringService` but
 * generic enough for reuse.
 *
 * @module utilities/sse-stream
 */

import { Response } from "express";
import { defaultWinstonLogger } from "@/utilities/winston-logger";

export interface SseClient {
  id: string;
  res: Response;
}

export class SseStream {
  private clients: Map<string, Response> = new Map();

  /** Add a new client and configure headers */
  public addClient(res: Response): string {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    this.clients.set(id, res);

    // SSE headers
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.flushHeaders();

    // Send initial comment to keep connection open
    res.write(": connected\n\n");

    // Remove on close
    res.on("close", () => {
      this.removeClient(id);
    });

    defaultWinstonLogger.info("SSE client connected", { id });
    return id;
  }

  /** Remove client by id */
  public removeClient(id: string): void {
    const res = this.clients.get(id);
    if (res) {
      res.end();
      this.clients.delete(id);
      defaultWinstonLogger.info("SSE client disconnected", { id });
    }
  }

  /** Broadcast data to all connected clients */
  public broadcast(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [, res] of this.clients) {
      res.write(payload);
    }
  }

  /** Current connections count */
  public getClientCount(): number {
    return this.clients.size;
  }
}

export const activitySseStream = new SseStream();
