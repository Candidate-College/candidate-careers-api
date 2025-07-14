import fs from "fs";
import zlib from "zlib";
import path from "path";
import ActivityRetentionService from "@/services/audit/activity-retention-service";
import { ActivityLog } from "@/models/activity-log-model";

// Mock filesystem writes to avoid real disk IO
jest.mock("fs");
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock zlib.gzip to return Buffer immediately
jest.mock("zlib", () => {
  return {
    gzip: (data: Buffer, cb: (err: unknown, buf: Buffer) => void) => cb(null, data),
  };
});

// Helper: build Objection-like query mock
function queryMock(rows: any[]) {
  const q: any = {
    _rows: rows,
    clone() {
      return queryMock(rows);
    },
    where() {
      return this;
    },
    orderBy() {
      return this;
    },
    async delete() {
      return rows.length;
    },
    async patch() {
      return rows.length;
    },
    async exec() {
      return rows;
    },
    async then(res: any) {
      return res(rows);
    },
    async count() {
      return [{ count: rows.length.toString() }];
    },
  };
  return q;
}

jest.mock("@/models/activity-log-model", () => ({
  ActivityLog: {
    query: jest.fn(),
  },
}));

function logRows(n: number, startId = 1) {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => ({
    id: startId + i,
    created_at: new Date(now - (i + 1) * 1_000_000),
    compressed: false,
  }));
}

// -------------------------------------------------------------------------

describe("ActivityRetentionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.writeFileSync.mockReset();
    mockedFs.mkdirSync.mockReset();
  });

  test("archiveOldLogs should return empty array when no logs", async () => {
    (ActivityLog.query as jest.Mock).mockReturnValue(queryMock([]));
    const files = await ActivityRetentionService.archiveOldLogs(1);
    expect(files).toEqual([]);
  });

  test("archiveOldLogs should gzip and write files", async () => {
    const rows = logRows(3);
    (ActivityLog.query as jest.Mock).mockReturnValue(queryMock(rows));
    mockedFs.writeFileSync.mockImplementation(() => void 0);
    mockedFs.mkdirSync.mockImplementation(() => void 0);

    const files = await ActivityRetentionService.archiveOldLogs(1);
    expect(files.length).toBe(1);
    expect(mockedFs.writeFileSync).toHaveBeenCalled();
  });

  test("deleteExpiredLogs should delete and return count", async () => {
    const rows = logRows(5);
    (ActivityLog.query as jest.Mock).mockReturnValue(queryMock(rows));
    const deleted = await ActivityRetentionService.deleteExpiredLogs(1);
    expect(deleted).toBe(5);
  });

  test("validateLogIntegrity should detect improper ordering", async () => {
    const goodRows = [
      { id: 1, created_at: new Date() },
      { id: 2, created_at: new Date() },
    ];
    (ActivityLog.query as jest.Mock).mockReturnValue(queryMock(goodRows));
    const ok = await ActivityRetentionService.validateLogIntegrity();
    expect(ok).toBe(true);

    const badRows = [
      { id: 2, created_at: new Date() },
      { id: 1, created_at: new Date() },
    ];
    (ActivityLog.query as jest.Mock).mockReturnValue(queryMock(badRows));
    const bad = await ActivityRetentionService.validateLogIntegrity();
    expect(bad).toBe(false);
  });
});
