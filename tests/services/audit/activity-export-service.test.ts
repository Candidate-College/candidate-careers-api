import ActivityExportService from "@/services/audit/activity-export-service";
import { ActivityExportFilters } from "@/interfaces/audit/activity-export";
import { ActivityLog } from "@/models/activity-log-model";

// -------------------------- Jest Mocks -----------------------------------

// Build a minimal chainable mock for Objection query builder
function createQueryMock(rows: any[]) {
  const qb: any = {
    _rows: rows,
    clone() {
      return createQueryMock(rows);
    },
    where() {
      return this; // chaining no-op for filters
    },
    orderBy() {
      return this;
    },
    limit() {
      return this;
    },
    async count() {
      return [{ count: rows.length.toString() }];
    },
    async first() {
      return { count: rows.length.toString() };
    },
    async then(resolver: any) {
      return resolver(rows);
    },
    async exec() {
      return rows;
    },
    async *[Symbol.asyncIterator]() {
      yield* rows;
    },
  };
  return qb;
}

jest.mock("@/models/activity-log-model", () => {
  return {
    ActivityLog: {
      query: jest.fn(),
    },
  };
});

// --------------------------- Test Data -----------------------------------

function generateLogs(n: number) {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    userId: (i % 3) + 1,
    action: "test_action",
    resourceType: "test",
    description: "lorem ipsum",
    severity: "low",
    category: "system",
    status: "success",
    createdAt: new Date(now - i * 1000),
  }));
}

// --------------------------- Test Suite ----------------------------------

describe("ActivityExportService", () => {
  const formats: Array<keyof typeof exporters> = ["csv", "json", "xlsx"];

  const exporters = {
    csv: ActivityExportService.exportToCSV,
    json: ActivityExportService.exportToJSON,
    xlsx: ActivityExportService.exportToExcel,
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Export empty dataset
  test.each(formats)("should export empty dataset (%s)", async (fmt) => {
    (ActivityLog.query as jest.Mock).mockReturnValue(createQueryMock([]));
    const result = await exporters[fmt]({});
    expect(result.totalRows).toBe(0);
    expect(result.byteLength).toBeGreaterThanOrEqual(0);
    expect(result.format).toBe(fmt);
  });

  // 2. Export small dataset (10 rows)
  test.each(formats)("should export 10 rows correctly (%s)", async (fmt) => {
    const rows = generateLogs(10);
    (ActivityLog.query as jest.Mock).mockReturnValue(createQueryMock(rows));
    const result = await exporters[fmt]({});
    expect(result.totalRows).toBe(10);
    expect(result.buffer.length).toBe(result.byteLength);
  });

  // 3. Large dataset batching (> batchSize)
  test("should handle large dataset with batching", async () => {
    const rows = generateLogs(12_345);
    (ActivityLog.query as jest.Mock).mockReturnValue(createQueryMock(rows));
    const batchSize = 5000;
    const res = await ActivityExportService.exportToCSV({}, batchSize);
    expect(res.totalRows).toBe(12_345);
  });

  // 4. Filter application (userId)
  test("should apply filters to query", async () => {
    const rows = generateLogs(5);
    const queryMock = createQueryMock(rows);
    const whereSpy = jest.spyOn(queryMock, "where");
    (ActivityLog.query as jest.Mock).mockReturnValue(queryMock);

    const filters: ActivityExportFilters = { userId: 2 };
    await ActivityExportService.exportToJSON(filters);
    expect(whereSpy).toHaveBeenCalledWith("user_id", 2);
  });

  // 5. Ensure CSV header integrity
  test("should include CSV headers", async () => {
    const rows = generateLogs(1);
    (ActivityLog.query as jest.Mock).mockReturnValue(createQueryMock(rows));
    const res = await ActivityExportService.exportToCSV({});
    const csv = res.buffer.toString("utf8").split("\n")[0];
    const headers = csv.split(",");
    expect(headers).toContain("id");
    expect(headers).toContain("userId");
  });
});
