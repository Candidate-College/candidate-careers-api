/**
 * ActivityMonitoringService Tests
 *
 * Focus: real-time streaming, suspicious activity detection, alert triggering,
 * and failure tracking.
 */

import EventEmitter from "events";
import ActivityMonitoringService, {
  ActivityEvent,
  SecurityAlert,
} from "@/services/audit/activity-monitoring-service";

jest.useFakeTimers();

describe("ActivityMonitoringService", () => {
  afterEach(() => {
    ActivityMonitoringService.__resetForTests();
    jest.clearAllTimers();
  });

  it("should emit activity events and store them in buffer", () => {
    const listener = jest.fn();
    ActivityMonitoringService.onActivity(listener);

    const evt: ActivityEvent = {
      action: "login_success",
      category: "authentication",
      severity: "low",
      status: "success",
      createdAt: new Date(),
    } as any;

    ActivityMonitoringService.monitorRealTimeActivity(evt);

    expect(listener).toHaveBeenCalledWith(evt);
    // @ts-ignore accessing private state via bracket notation for test
    expect((ActivityMonitoringService as any).buffer.length).toBe(1);
  });

  it("should detect suspicious activity when threshold exceeded", () => {
    const alertListener = jest.fn();
    ActivityMonitoringService.onAlert(alertListener);

    const now = new Date();
    for (let i = 0; i < 15; i++) {
      ActivityMonitoringService.monitorRealTimeActivity({
        action: "test_action",
        category: "system",
        severity: "low",
        status: "success",
        createdAt: now,
      } as ActivityEvent);
    }

    const suspicious = ActivityMonitoringService.detectSuspiciousActivity({
      timeWindowSeconds: 120,
      threshold: 10,
    });

    expect(suspicious).toBe(true);
    expect(alertListener).toHaveBeenCalled();
  });

  it("should track failed operations and trigger alerts on repeated failures", () => {
    const alertListener = jest.fn();
    ActivityMonitoringService.onAlert(alertListener);

    for (let i = 0; i < 5; i++) {
      ActivityMonitoringService.monitorRealTimeActivity({
        action: "update_record",
        category: "data_modification",
        severity: "medium",
        status: "failure",
        createdAt: new Date(),
      } as ActivityEvent);
    }

    expect(alertListener).toHaveBeenCalled();
  });

  it("should cap buffer at BUFFER_SIZE", () => {
    const bufferSize = 1000; // default fallback
    for (let i = 0; i < bufferSize + 50; i++) {
      ActivityMonitoringService.monitorRealTimeActivity({
        action: `a${i}`,
        category: "system",
        severity: "low",
        status: "success",
        createdAt: new Date(),
      } as ActivityEvent);
    }
    // @ts-ignore access private buffer
    expect((ActivityMonitoringService as any).buffer.length).toBe(bufferSize);
  });
});
