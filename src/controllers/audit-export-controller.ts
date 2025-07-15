/**
 * Audit Export & Stream Controller
 *
 * Provides endpoints for:
 *  – Exporting audit logs into CSV, JSON, or XLSX formats
 *  – Streaming recent audit logs via Server-Sent Events (SSE)
 *
 * This controller purposely lives in a dedicated file to keep the main
 * `audit-controller.ts` focused and the total LOC per file <300.
 *
 * @module controllers/audit-export-controller
 */

import { Request } from 'express';
import { JsonResponse } from '@/types/express-extension';
import ActivityExportService from '@/services/audit/activity-export-service';
import { ActivityRetrievalService } from '@/services/audit/activity-retrieval-service';
import { defaultWinstonLogger as logger } from '@/utilities/winston-logger';

/**
 * POST /admin/audit/export
 *
 * Body parameters (JSON):
 *  – format: "csv" | "json" | "xlsx" (default "csv")
 *  – batchSize?: number – override default batch size during export
 *  – userId?, dateFrom?, dateTo?, category?, severity? – optional filters
 */
exports.exportLogs = async (req: Request, res: JsonResponse) => {
  const {
    format = 'csv',
    batchSize,
    userId,
    dateFrom,
    dateTo,
    category,
    severity,
  } = req.body ?? {};

  try {
    const filters = {
      userId: userId ? Number(userId) : undefined,
      dateFrom,
      dateTo,
      category,
      severity,
    } as any;

    let result;
    switch (format) {
      case 'json':
        result = await ActivityExportService.exportToJSON(filters, batchSize);
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.json"');
        break;
      case 'xlsx':
        result = await ActivityExportService.exportToExcel(filters, batchSize);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.xlsx"');
        break;
      default:
        result = await ActivityExportService.exportToCSV(filters, batchSize);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    }

    return res.send(result.buffer);
  } catch (err: any) {
    logger.error('audit-export-controller@exportLogs', err);
    return res.error(500, 'Failed to export audit logs');
  }
};

/**
 * GET /admin/audit/stream – Server-Sent Events stream of recent logs.
 * Pushes last 10 activities every second. Intended for admin dashboards.
 */
exports.streamLogs = async (_req: Request, res: any) => {
  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const sendData = async () => {
    try {
      const { data } = await ActivityRetrievalService.getRecentActivities(10, true);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err: any) {
      logger.error('audit-export-controller@streamLogs', err);
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'stream error' })}\n\n`);
    }
  };

  // Initial push
  await sendData();
  const interval = setInterval(sendData, 1000);

  // Cleanup on client disconnect
  res.on('close', () => {
    clearInterval(interval);
    res.end();
  });
};
