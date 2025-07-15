# User Activity & Audit Logging

# User Story

As a system administrator and compliance officer for CC Career platform, I want to comprehensively track and log all user activities and system changes through a robust audit logging system, so that I can maintain security oversight, ensure compliance, and investigate security incidents with complete activity trails.

# Dependencies

- Database schema for activity_logs table
- Basic authentication infrastructure (can work parallel with Task 1)
- User management foundation
- JSON processing capabilities for metadata storage

# Acceptance Criteria

1. Implement comprehensive activity logging middleware for automatic event capture
2. Create manual activity logging service for custom events
3. Implement audit log retrieval API with advanced filtering and search capabilities
4. Create activity log analysis and reporting functionality
5. Implement log retention and archival policies
6. Create comprehensive input validation for all logging operations
7. All components must have unit tests with minimum 90% code coverage
8. Implement real-time activity monitoring and alerting for suspicious activities
9. Create data export functionality for compliance reporting
10. Support different log levels and categories for efficient monitoring

# Definition of Done

1. All acceptance criteria have been met and verified
2. Code has been reviewed by at least one other team member
3. All unit tests pass with minimum 90% coverage
4. Integration tests with user management and authentication systems pass successfully
5. Performance testing completed (logging doesn't impact API response times)
6. Security testing completed (log injection prevention, data integrity)
7. API documentation updated with complete endpoint specifications
8. Compliance testing shows audit trail completeness
9. Code follows project coding standards and conventions

# Technical Specifications

## Database Schema Enhancement

### Activity Logs Table (Enhanced)

```sql
CREATE TABLE activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NULL,
    session_id VARCHAR(255) NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id BIGINT NULL,
    resource_uuid VARCHAR(36) NULL,
    description TEXT NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    metadata JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    category ENUM('authentication', 'authorization', 'user_management', 'data_modification', 'system', 'security') NOT NULL,
    status ENUM('success', 'failure', 'error') DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_resource_type (resource_type),
    INDEX idx_category_severity (category, severity),
    INDEX idx_created_at (created_at),
    INDEX idx_ip_address (ip_address),
    INDEX idx_session_id (session_id)
);
```

## API Endpoints to Implement

### 1. Get Activity Logs (`GET /api/v1/admin/audit/logs`)

**Authorization**: Super Admin only
**Query Parameters**:

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 50, max: 200)
- `user_id` (optional): Filter by specific user
- `action` (optional): Filter by action type
- `resource_type` (optional): Filter by resource type
- `category` (optional): Filter by log category
- `severity` (optional): Filter by severity level
- `status` (optional): Filter by operation status
- `date_from` (optional): Filter logs from date
- `date_to` (optional): Filter logs to date
- `ip_address` (optional): Filter by IP address
- `search` (optional): Search in description and metadata

**Response Success (200)**:

```json
{
  "status": 200,
  "message": "Activity logs retrieved successfully",
  "data": {
    "logs": [
      {
        "id": "integer",
        "user": {
          "id": "integer",
          "name": "string",
          "email": "string"
        },
        "action": "string",
        "resource_type": "string",
        "resource_id": "integer",
        "description": "string",
        "old_values": "object",
        "new_values": "object",
        "metadata": "object",
        "ip_address": "string",
        "user_agent": "string",
        "severity": "string",
        "category": "string",
        "status": "string",
        "created_at": "datetime"
      }
    ],
    "pagination": {
      "total": "integer",
      "per_page": "integer",
      "current_page": "integer",
      "total_pages": "integer"
    },
    "summary": {
      "total_events": "integer",
      "success_rate": "float",
      "categories": "object",
      "severity_breakdown": "object"
    }
  }
}
```

### 2. Get Single Activity Log (`GET /api/v1/admin/audit/logs/{id}`)

**Authorization**: Super Admin only
**Response**: Detailed view of specific activity log

### 3. Get User Activity History (`GET /api/v1/admin/audit/users/{uuid}/activity`)

**Authorization**: Super Admin only
**Response**: Complete activity history for specific user

### 4. Get Activity Statistics (`GET /api/v1/admin/audit/statistics`)

**Authorization**: Super Admin only
**Query Parameters**:

- `period` (optional): Time period (day, week, month, year)
- `group_by` (optional): Group statistics by (action, category, user, hour)

### 5. Export Activity Logs (`POST /api/v1/admin/audit/export`)

**Authorization**: Super Admin only
**Request Body**:

```json
{
  "format": "string (csv, json, xlsx)",
  "filters": "object (same as GET filters)",
  "email_to": "string (optional, email address for delivery)"
}
```

### 6. Real-time Activity Stream (`GET /api/v1/admin/audit/stream`)

**Authorization**: Super Admin only
**Response**: Server-sent events stream of real-time activities

### 7. Activity Analytics Dashboard (`GET /api/v1/admin/audit/dashboard`)

**Authorization**: Super Admin only
**Response**: Dashboard data with charts and metrics

## Core Components to Implement

### 1. Activity Logging Service (`/services/audit/ActivityLoggingService.js`)

- `logActivity(userId, action, resourceType, resourceId, description, options)` - Log any activity
- `logUserAction(userId, action, oldData, newData, metadata)` - Log user-specific actions
- `logSystemEvent(action, description, metadata)` - Log system events
- `logSecurityEvent(userId, action, severity, metadata)` - Log security-related events
- `logAuthenticationEvent(userId, action, success, metadata)` - Log auth events

### 2. Activity Retrieval Service (`/services/audit/ActivityRetrievalService.js`)

- `getActivityLogs(filters, pagination, sorting)` - Get filtered activity logs
- `getUserActivityHistory(userId, pagination)` - Get user-specific activities
- `getActivityById(logId)` - Get detailed activity information
- `searchActivities(query, filters)` - Search through activity descriptions and metadata

### 3. Activity Analytics Service (`/services/audit/ActivityAnalyticsService.js`)

- `getActivityStatistics(period, groupBy)` - Generate activity statistics
- `getDashboardData()` - Get dashboard metrics and charts
- `detectAnomalousActivity(userId, timeWindow)` - Detect unusual activity patterns
- `generateComplianceReport(startDate, endDate)` - Generate compliance reports

### 4. Activity Monitoring Service (`/services/audit/ActivityMonitoringService.js`)

- `monitorRealTimeActivity()` - Real-time activity stream
- `detectSuspiciousActivity(activityData)` - Identify suspicious patterns
- `triggerSecurityAlerts(severity, activity)` - Send security alerts
- `trackFailedOperations()` - Monitor and alert on failures

### 5. Activity Export Service (`/services/audit/ActivityExportService.js`)

- `exportToCSV(activities, filename)` - Export activities to CSV
- `exportToJSON(activities, filename)` - Export activities to JSON
- `exportToExcel(activities, filename)` - Export activities to Excel
- `schedulePeriodicExport(schedule, filters)` - Schedule automatic exports

### 6. Activity Logging Middleware (`/middleware/activityLogger.js`)

- `logAPIRequest` - Automatically log API requests and responses
- `logAuthenticationAttempts` - Log login/logout attempts
- `logDataModifications` - Log create/update/delete operations
- `logPermissionChanges` - Log role and permission changes

### 7. Activity Retention Service (`/services/audit/ActivityRetentionService.js`)

- `archiveOldLogs(retentionPeriod)` - Archive logs older than retention period
- `deleteExpiredLogs(deletionPeriod)` - Delete logs past deletion period
- `compressLogData(compressionRatio)` - Compress old log data
- `validateLogIntegrity()` - Ensure log data integrity

### 8. Audit Controller (`/controllers/AuditController.js`)

- All audit and activity log endpoints
- Proper error handling and response formatting
- Performance optimization for large datasets
- Real-time streaming capabilities

## Activity Categories and Actions

### Authentication Category

```javascript
const AUTHENTICATION_ACTIONS = {
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILED: "login_failed",
  LOGOUT: "logout",
  TOKEN_REFRESH: "token_refresh",
  PASSWORD_CHANGE: "password_change",
  PASSWORD_RESET: "password_reset",
  ACCOUNT_LOCKED: "account_locked",
  EMAIL_VERIFICATION: "email_verification",
};
```

### User Management Category

```javascript
const USER_MANAGEMENT_ACTIONS = {
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",
  ROLE_ASSIGNED: "role_assigned",
  ROLE_REMOVED: "role_removed",
  PERMISSION_GRANTED: "permission_granted",
  PERMISSION_REVOKED: "permission_revoked",
  USER_IMPERSONATED: "user_impersonated",
};
```

### Data Modification Category

```javascript
const DATA_MODIFICATION_ACTIONS = {
  RECORD_CREATED: "record_created",
  RECORD_UPDATED: "record_updated",
  RECORD_DELETED: "record_deleted",
  BULK_OPERATION: "bulk_operation",
  DATA_IMPORTED: "data_imported",
  DATA_EXPORTED: "data_exported",
};
```

## Environment Variables Required

```
AUDIT_LOG_RETENTION_DAYS=2555
AUDIT_LOG_DELETION_DAYS=3650
AUDIT_REAL_TIME_BUFFER_SIZE=1000
AUDIT_EXPORT_MAX_RECORDS=100000
AUDIT_SUSPICIOUS_ACTIVITY_THRESHOLD=10
AUDIT_ALERT_EMAIL_TO=security@company.com
AUDIT_COMPRESSION_ENABLED=true
AUDIT_PERFORMANCE_LOG_SLOW_QUERIES=true
```

# Test Cases and Scenarios

## Activity Logging Service Tests (`/tests/services/ActivityLoggingService.test.js`)

### Test Case 1: Basic Activity Logging

**Scenario**: Log various types of activities

```javascript
describe("Basic Activity Logging", () => {
  test("should log user activity with complete metadata", async () => {
    // Test comprehensive activity logging
  });

  test("should log system events without user context", async () => {
    // Test system-level event logging
  });

  test("should log authentication events with security context", async () => {
    // Test authentication event logging
  });

  test("should capture IP address and user agent", async () => {
    // Test request metadata capture
  });

  test("should store old and new values for data changes", async () => {
    // Test change tracking
  });

  // Failing test cases
  test("should fail with invalid activity data", async () => {
    // Test validation of logging parameters
  });

  test("should fail when database is unavailable", async () => {
    // Test database failure handling
  });

  test("should fail with malformed JSON metadata", async () => {
    // Test JSON validation
  });

  test("should prevent log injection attacks", async () => {
    // Test security against log injection
  });
});
```

### Test Case 2: Activity Categorization and Severity

**Scenario**: Properly categorize and assign severity to activities

```javascript
describe("Activity Categorization", () => {
  test("should assign correct category to authentication events", async () => {
    // Test category assignment logic
  });

  test("should assign appropriate severity levels", async () => {
    // Test severity assignment
  });

  test("should handle custom categories and actions", async () => {
    // Test extensibility
  });

  // Failing test cases
  test("should fail with invalid category", async () => {
    // Test category validation
  });

  test("should fail with invalid severity level", async () => {
    // Test severity validation
  });

  test("should default to appropriate values for missing fields", async () => {
    // Test default value handling
  });
});
```

### Test Case 3: Activity Middleware Integration

**Scenario**: Automatic activity logging through middleware

```javascript
describe("Activity Middleware Integration", () => {
  test("should automatically log API requests", async () => {
    // Test middleware request logging
  });

  test("should log authentication attempts", async () => {
    // Test auth middleware integration
  });

  test("should log data modification operations", async () => {
    // Test CRUD operation logging
  });

  test("should exclude sensitive data from logs", async () => {
    // Test data sanitization
  });

  // Failing test cases
  test("should fail gracefully when logging service is down", async () => {
    // Test middleware error handling
  });

  test("should not impact API performance significantly", async () => {
    // Test performance impact
  });

  test("should handle concurrent requests without data corruption", async () => {
    // Test concurrency safety
  });
});
```

## Activity Retrieval Service Tests (`/tests/services/ActivityRetrievalService.test.js`)

### Test Case 4: Activity Log Retrieval and Filtering

**Scenario**: Retrieve activities with various filters

```javascript
describe("Activity Log Retrieval", () => {
  test("should retrieve paginated activity logs", async () => {
    // Test pagination functionality
  });

  test("should filter activities by user", async () => {
    // Test user-based filtering
  });

  test("should filter activities by date range", async () => {
    // Test date range filtering
  });

  test("should filter activities by category and severity", async () => {
    // Test category/severity filtering
  });

  test("should search activities by description", async () => {
    // Test text search functionality
  });

  // Failing test cases
  test("should fail with invalid date range", async () => {
    // Test date validation
  });

  test("should fail with excessive page size", async () => {
    // Test pagination limits
  });

  test("should fail with invalid filter parameters", async () => {
    // Test filter validation
  });

  test("should handle empty result sets gracefully", async () => {
    // Test no results scenario
  });
});
```

### Test Case 5: Activity Search and Analytics

**Scenario**: Search activities and generate analytics

```javascript
describe("Activity Search and Analytics", () => {
  test("should search activities by metadata content", async () => {
    // Test metadata search
  });

  test("should generate activity statistics by period", async () => {
    // Test statistical analysis
  });

  test("should detect activity patterns and anomalies", async () => {
    // Test pattern detection
  });

  test("should generate dashboard metrics", async () => {
    // Test dashboard data generation
  });

  // Failing test cases
  test("should fail with malformed search queries", async () => {
    // Test search query validation
  });

  test("should fail with invalid analytics parameters", async () => {
    // Test analytics parameter validation
  });

  test("should handle large datasets efficiently", async () => {
    // Test performance with big data
  });
});
```

## Activity Monitoring Service Tests (`/tests/services/ActivityMonitoringService.test.js`)

### Test Case 6: Real-time Activity Monitoring

**Scenario**: Monitor activities in real-time for security

```javascript
describe("Real-time Activity Monitoring", () => {
  test("should stream real-time activities", async () => {
    // Test real-time streaming
  });

  test("should detect suspicious activity patterns", async () => {
    // Test anomaly detection
  });

  test("should trigger security alerts for critical events", async () => {
    // Test alerting system
  });

  test("should track failed operations and attempts", async () => {
    // Test failure tracking
  });

  // Failing test cases
  test("should fail when alert system is unavailable", async () => {
    // Test alert system failure handling
  });

  test("should prevent false positive alerts", async () => {
    // Test alert accuracy
  });

  test("should handle high-volume activity streams", async () => {
    // Test scalability under load
  });

  test("should fail gracefully during detection algorithm errors", async () => {
    // Test algorithm error handling
  });
});
```

## Activity Export Service Tests (`/tests/services/ActivityExportService.test.js`)

### Test Case 7: Activity Data Export

**Scenario**: Export activity data for compliance and analysis

```javascript
describe("Activity Data Export", () => {
  test("should export activities to CSV format", async () => {
    // Test CSV export functionality
  });

  test("should export activities to JSON format", async () => {
    // Test JSON export functionality
  });

  test("should export activities to Excel format", async () => {
    // Test Excel export functionality
  });

  test("should handle large datasets in batches", async () => {
    // Test batch export processing
  });

  test("should include all relevant fields in export", async () => {
    // Test export completeness
  });

  // Failing test cases
  test("should fail with unsupported export format", async () => {
    // Test format validation
  });

  test("should fail when export data exceeds limits", async () => {
    // Test size limit enforcement
  });

  test("should fail with invalid date range for export", async () => {
    // Test export parameter validation
  });

  test("should handle file system errors during export", async () => {
    // Test file system error handling
  });
});
```

## Activity Retention Service Tests (`/tests/services/ActivityRetentionService.test.js`)

### Test Case 8: Log Retention and Archival

**Scenario**: Manage log retention and archival policies

```javascript
describe("Log Retention and Archival", () => {
  test("should archive logs older than retention period", async () => {
    // Test log archival process
  });

  test("should delete logs older than deletion period", async () => {
    // Test log deletion process
  });

  test("should compress archived log data", async () => {
    // Test log compression
  });

  test("should maintain log integrity during operations", async () => {
    // Test data integrity
  });

  // Failing test cases
  test("should fail when archive storage is unavailable", async () => {
    // Test storage failure handling
  });

  test("should prevent deletion of logs within retention period", async () => {
    // Test retention policy enforcement
  });

  test("should fail with corrupted log data", async () => {
    // Test data corruption handling
  });

  test("should handle large-scale retention operations", async () => {
    // Test scalability of retention operations
  });
});
```

## API Controller Tests (`/tests/controllers/AuditController.test.js`)

### Test Case 9: Audit API Endpoints

**Scenario**: Test complete audit log management API

```javascript
describe("Audit API Endpoints", () => {
  test("GET /api/v1/admin/audit/logs should return filtered logs", async () => {
    // Test log retrieval endpoint
  });

  test("GET /api/v1/admin/audit/statistics should return analytics", async () => {
    // Test statistics endpoint
  });

  test("POST /api/v1/admin/audit/export should trigger export", async () => {
    // Test export endpoint
  });

  test("GET /api/v1/admin/audit/stream should provide real-time stream", async () => {
    // Test streaming endpoint
  });

  // Failing test cases
  test("should return 401 for non-authenticated requests", async () => {
    // Test authentication requirement
  });

  test("should return 403 for non-super-admin users", async () => {
    // Test authorization requirement
  });

  test("should return 400 for invalid query parameters", async () => {
    // Test parameter validation
  });

  test("should return 429 for excessive API usage", async () => {
    // Test rate limiting
  });

  test("should handle large result sets efficiently", async () => {
    // Test performance with large datasets
  });
});
```

## Integration Tests (`/tests/integration/auditLogging.integration.test.js`)

### Test Case 10: End-to-End Audit Logging Flow

**Scenario**: Complete audit logging system workflow

```javascript
describe("Audit Logging Integration", () => {
  test("should capture complete user session activities", async () => {
    // Test: login -> actions -> logout with complete audit trail
  });

  test("should maintain audit trail consistency across operations", async () => {
    // Test data consistency across related activities
  });

  test("should integrate with all system components", async () => {
    // Test integration with auth, user management, etc.
  });

  test("should handle concurrent logging from multiple users", async () => {
    // Test concurrent access and logging
  });

  // Failing test cases
  test("should handle database connection failures", async () => {
    // Test database failure resilience
  });

  test("should maintain performance under high logging volume", async () => {
    // Test performance under load
  });

  test("should prevent log data corruption during system failures", async () => {
    // Test data integrity under failure conditions
  });

  test("should ensure audit trail completeness during errors", async () => {
    // Test logging completeness during error scenarios
  });

  test("should handle log storage failures gracefully", async () => {
    // Test storage failure handling
  });
});
```

# Security Considerations

## Data Protection

- Sanitization of sensitive data in logs
- Encryption of archived log data
- Access control for log viewing
- Prevention of log injection attacks

## Integrity Assurance

- Tamper-proof log storage
- Digital signatures for log entries
- Checksums for data integrity
- Audit trail for audit logs themselves

## Privacy Compliance

- GDPR compliance for personal data in logs
- Data anonymization options
- Right to be forgotten implementation
- Consent tracking for data processing

# Performance Considerations

## Logging Performance

- Asynchronous logging to prevent API delays
- Batch processing for high-volume logs
- Database indexing for efficient queries
- Log rotation and archival strategies

## Query Optimization

- Indexed searches on common filter fields
- Pagination for large result sets
- Caching for frequent queries
- Efficient aggregation queries

# Compliance and Reporting

## Audit Standards

- SOX compliance for financial data
- HIPAA compliance if applicable
- ISO 27001 logging requirements
- Industry-specific compliance needs

## Reporting Capabilities

- Automated compliance reports
- Custom report generation
- Real-time monitoring dashboards
- Scheduled report delivery

# API Documentation Requirements

## Audit Log Documentation

- Complete API endpoint specifications
- Filter and search capabilities
- Export format documentation
- Real-time streaming usage

## Compliance Documentation

- Audit trail specifications
- Data retention policies
- Privacy and security measures
- Integration guidelines

# Dependencies

- `jsonwebtoken` - Token validation for log context
- `express-rate-limit` - API rate limiting
- `lodash` - Data manipulation
- `csv-writer` - CSV export functionality
- `xlsx` - Excel export functionality
- Database ORM for log storage
- Email service for alert notifications

# Risks and Mitigation

1. **Performance Risk**: Logging overhead affecting system performance
   - **Mitigation**: Asynchronous logging, efficient storage, performance monitoring
2. **Storage Risk**: Rapid log growth consuming storage space
   - **Mitigation**: Log rotation, compression, archival policies, monitoring
3. **Security Risk**: Unauthorized access to sensitive audit data
   - **Mitigation**: Strong access controls, encryption, audit trail protection
4. **Compliance Risk**: Incomplete audit trails affecting compliance
   - **Mitigation**: Comprehensive logging coverage, integrity verification, regular audits

# Success Criteria

- All unit tests pass with 90%+ coverage
- Integration tests demonstrate complete audit trail capture
- Performance impact on API responses <10ms additional latency
- Real-time monitoring detects suspicious activities effectively
- Export functionality handles large datasets efficiently
- Compliance reports meet regulatory requirements
- Security testing shows no unauthorized access vulnerabilities
- Log retention and archival policies work automatically
- Code review approval from senior developer
- Documentation complete and accurate
