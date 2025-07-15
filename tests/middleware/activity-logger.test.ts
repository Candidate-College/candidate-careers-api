/**
 * Activity Logger Middleware Tests
 *
 * Verifies that the middleware invokes ActivityLogService with the expected
 * parameters and never blocks response flow even when ActivityLogService
 * throws errors.
 */

import request from "supertest";
import app from "@/app";
import ActivityLogService from "@/services/audit/activity-log-service";

jest.mock("@/services/audit/activity-log-service");

const mockedLogActivity = jest.fn().mockResolvedValue({ success: true });
(ActivityLogService as jest.Mocked<typeof ActivityLogService>).logActivity =
  mockedLogActivity as any;

describe("Activity Logger Middleware", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call ActivityLogService.logActivity with derived action and resource", async () => {
    const res = await request(app).get("/api/v1/healthz").set("User-Agent", "jest");

    expect(res.status).not.toBe(500);
    expect(mockedLogActivity).toHaveBeenCalledTimes(1);

    const callArgs = mockedLogActivity.mock.calls[0][0];
    expect(callArgs.action).toContain("GET /api/v1/healthz");
    expect(callArgs.resourceType).toBe("healthz");
    expect(callArgs.userAgent).toBe("jest");
  });

  it("should swallow errors from ActivityLogService and still succeed", async () => {
    mockedLogActivity.mockRejectedValueOnce(new Error("db offline"));

    const res = await request(app).post("/api/v1/users").send({ email: "test@test.com" });

    expect(res.status).not.toBe(500);
    // Even though error, middleware should have attempted the log
    expect(mockedLogActivity).toHaveBeenCalled();
  });
});
