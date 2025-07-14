/**
 * Activity Monitoring Service
 *
 * Provides real-time monitoring utilities for the audit subsystem.  Core
 * responsibilities:
 * 1. Collect audit events in an in-memory circular buffer (size controlled by
 *    AUDIT_REAL_TIME_BUFFER_SIZE env variable, fallback 1 000).
 * 2. Expose a global EventEmitter stream (`activityEmitter`) so other layers –
 *    e.g. controllers – can push or subscribe to events (used by SSE route).
 * 3. Detect suspicious activity volumes within a configurable sliding window.
 * 4. Trigger security alerts via Winston and dedicated "alert" emitter event.
 * 5. Track failed operations to feed analytics / alerting.
 *
 * Design notes:
 * – Pure static utility class → no instantiation required.
 * – All state is kept in private static members; resets easily in tests.
 * – Uses Node's built-in `events` module – no extra dependency.
 * – <300 LOC including docs (guard rails).
 * – No persistence here; long-term storage remains in DB through
 *   ActivityLogService.
 * – Strict TypeScript typing; never uses `any`.
 *
 * @module services/audit/activity-monitoring-service
 */

import { EventEmitter } from "events";
import dayjs from "dayjs";
import { defaultWinstonLogger } from "@/utilities/winston-logger";
import {
  ActivitySeverity,
  ActivityStatus,
  ActivityCategory,
} from "@/constants/activity-log-constants";

/** Audit event payload shape sent through the emitter */
export interface ActivityEvent {
  id?: number; // DB primary key (optional for real-time newly created)
  userId?: number | null;
  action: string;
  category: ActivityCategory | string;
  severity: ActivitySeverity | string;
  status: ActivityStatus | string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

/** Security alert structure emitted by `alert` channel */
export interface SecurityAlert {
  reason: string;
  events: ActivityEvent[];
  triggeredAt: Date;
}

export class ActivityMonitoringService {
  /** Global singleton emitter */
  public static readonly activityEmitter = new EventEmitter().setMaxListeners(0);

  private static readonly BUFFER_SIZE: number = Number(
    process.env.AUDIT_REAL_TIME_BUFFER_SIZE ?? 1000
  );

  /** Circular buffer to store recent events */
  private static readonly buffer: ActivityEvent[] = [];

  /** Failed operation counters keyed by action */
  private static readonly failedCounters: Record<string, number> = {};

  /**
   * Push an activity event to the real-time stream & buffer.
   * Consumers may listen: `activityEmitter.on("activity", handler)`.
   */
  public static monitorRealTimeActivity(event: ActivityEvent): void {
    // Guard clause: ensure createdAt present
    if (!event.createdAt) event.createdAt = new Date();

    // Add to buffer (circular logic)
    if (this.buffer.length >= this.BUFFER_SIZE) {
      this.buffer.shift();
    }
    this.buffer.push(event);

    // Emit to listeners (non-blocking)
    this.activityEmitter.emit("activity", event);

    // If status denotes failure, track it
    if (event.status === ActivityStatus.FAILURE || event.status === ActivityStatus.ERROR) {
      this.trackFailedOperations(event.action);
    }
  }

  /**
   * Detect suspicious activity spikes within the last `timeWindowSeconds`.
   * Returns true when event count >= threshold.
   */
  public static detectSuspiciousActivity(options?: {
    timeWindowSeconds?: number;
    threshold?: number;
  }): boolean {
    const windowSeconds = options?.timeWindowSeconds ?? 60; // 1 minute default
    const threshold =
      options?.threshold ??
      Number(process.env.AUDIT_SUSPICIOUS_ACTIVITY_THRESHOLD ?? 10);

    const since = dayjs().subtract(windowSeconds, "second").toDate();
    const recent = this.buffer.filter((e) => e.createdAt >= since);

    const isSuspicious = recent.length >= threshold;

    if (isSuspicious) {
      this.triggerSecurityAlerts("High activity volume", recent);
    }

    return isSuspicious;
  }

  /**
   * Emit a security alert event & log through Winston.
   */
  public static triggerSecurityAlerts(reason: string, events: ActivityEvent[]): void {
    const alert: SecurityAlert = {
      reason,
      events,
      triggeredAt: new Date(),
    };

    // Winston structured log
    defaultWinstonLogger.warn("Security alert triggered", {
      reason,
      count: events.length,
    });

    // Emit through separate channel
    this.activityEmitter.emit("alert", alert);
  }

  /**
   * Increment failed operation counter and optionally log when spike seen.
   */
  public static trackFailedOperations(action: string): void {
    this.failedCounters[action] = (this.failedCounters[action] ?? 0) + 1;

    // Simple heuristic: 5+ failures in 1 minute for same action
    if (this.failedCounters[action] === 1) {
      // Reset after 60s so counters are rolling
      setTimeout(() => {
        this.failedCounters[action] = 0;
      }, 60_000);
    }

    if (this.failedCounters[action] >= 5) {
      this.triggerSecurityAlerts(`Repeated failures for ${action}`, this.buffer.filter((e) => e.action === action));
    }
  }

  /**
   * Utility to subscribe to activity events (sugar for emitter on/off).
   */
  public static onActivity(listener: (e: ActivityEvent) => void): void {
    this.activityEmitter.on("activity", listener);
  }

  public static offActivity(listener: (e: ActivityEvent) => void): void {
    this.activityEmitter.off("activity", listener);
  }

  /**
   * Subscribe to security alert events.
   */
  public static onAlert(listener: (a: SecurityAlert) => void): void {
    this.activityEmitter.on("alert", listener);
  }

  public static offAlert(listener: (a: SecurityAlert) => void): void {
    this.activityEmitter.off("alert", listener);
  }

  /**
   * For tests: reset internal state (buffer & counters) safely.
   */
  /* istanbul ignore next */
  public static __resetForTests(): void {
    this.buffer.splice(0, this.buffer.length);
    for (const key of Object.keys(this.failedCounters)) {
      delete this.failedCounters[key];
    }
  }
}

export default ActivityMonitoringService;
