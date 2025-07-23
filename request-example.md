# Job Analytics API — HTTPie Request Examples

## 1. Job Performance Analytics (GET /api/v1/jobs/{uuid}/analytics)

Authorization: Authenticated users (HR roles)
Path Parameters:

- uuid: string (required, valid UUID format)

### Example Variations

1. Basic analytics for a job (default period)

```sh
http GET :8000/api/v1/jobs/1/analytics Authorization:'Bearer <HR_TOKEN>'
```

2. Analytics for a job with 30-day period, daily granularity

```sh
http GET :8000/api/v1/jobs/1/analytics?period=30d&granularity=day Authorization:'Bearer <HR_TOKEN>'
```

3. Analytics with comparisons and specific metrics

```sh
http GET :8000/api/v1/jobs/1/analytics?period=14d&granularity=week&include_comparisons=true&metrics=views,applications,conversion_rate Authorization:'Bearer <HR_TOKEN>'
```

4. Analytics for a custom date range

```sh
http GET :8000/api/v1/jobs/1/analytics?start_date=2024-07-01&end_date=2024-07-15 Authorization:'Bearer <HR_TOKEN>'
```

5. Analytics with invalid UUID (should return 404)

```sh
http GET :8000/api/v1/jobs/99999/analytics Authorization:'Bearer <HR_TOKEN>'
```

---

## 2. Bulk Jobs Analytics (GET /api/v1/jobs/analytics/bulk)

Authorization: Authenticated users (HR roles)
Query Parameters:

- job_uuids: comma-separated UUIDs (required)
- period, metrics, sort_by, order (optional)

### Example Variations

1. Bulk analytics for 3 jobs (default metrics)

```sh
http GET :8000/api/v1/jobs/analytics/bulk?job_uuids=1,2,3 Authorization:'Bearer <HR_TOKEN>'
```

2. Bulk analytics with period and metrics

```sh
http GET :8000/api/v1/jobs/analytics/bulk?job_uuids=1,2,3&period=7d&metrics=views,applications Authorization:'Bearer <HR_TOKEN>'
```

3. Bulk analytics sorted by conversion_rate descending

```sh
http GET :8000/api/v1/jobs/analytics/bulk?job_uuids=1,2,3&sort_by=conversion_rate&order=desc Authorization:'Bearer <HR_TOKEN>'
```

4. Bulk analytics with empty job list (should return 422)

```sh
http GET :8000/api/v1/jobs/analytics/bulk?job_uuids= Authorization:'Bearer <HR_TOKEN>'
```

5. Bulk analytics with some invalid UUIDs

```sh
http GET :8000/api/v1/jobs/analytics/bulk?job_uuids=1,99999,2 Authorization:'Bearer <HR_TOKEN>'
```

---

## 3. Department Analytics (GET /api/v1/analytics/departments/{department_id})

Authorization: Authenticated users (HR roles)
Path Parameters:

- department_id: string (required)
  Query Parameters:
- period, start_date, end_date (optional)

### Example Variations

1. Department analytics (default period)

```sh
http GET :8000/api/v1/analytics/departments/1 Authorization:'Bearer <HR_TOKEN>'
```

2. Department analytics for 30-day period

```sh
http GET :8000/api/v1/analytics/departments/1?period=30d Authorization:'Bearer <HR_TOKEN>'
```

3. Department analytics for custom date range

```sh
http GET :8000/api/v1/analytics/departments/1?start_date=2024-07-01&end_date=2024-07-31 Authorization:'Bearer <HR_TOKEN>'
```

4. Department analytics for non-existent department (should return 404)

```sh
http GET :8000/api/v1/analytics/departments/99999 Authorization:'Bearer <HR_TOKEN>'
```

5. Department analytics with invalid date range (should return 422)

```sh
http GET :8000/api/v1/analytics/departments/1?start_date=2024-08-01&end_date=2024-07-01 Authorization:'Bearer <HR_TOKEN>'
```

---

## 4. Platform Analytics Overview (GET /api/v1/analytics/overview)

Authorization: Super Admin, Head of HR

### Example Variations

1. Platform overview (default)

```sh
http GET :8000/api/v1/analytics/overview Authorization:'Bearer <ADMIN_TOKEN>'
```

2. Platform overview for 30-day period

```sh
http GET :8000/api/v1/analytics/overview?period=30d Authorization:'Bearer <ADMIN_TOKEN>'
```

3. Platform overview for custom date range

```sh
http GET :8000/api/v1/analytics/overview?start_date=2024-07-01&end_date=2024-07-31 Authorization:'Bearer <ADMIN_TOKEN>'
```

4. Platform overview with insufficient permissions (should return 403)

```sh
http GET :8000/api/v1/analytics/overview Authorization:'Bearer <HR_TOKEN>'
```

5. Platform overview with invalid token (should return 401)

```sh
http GET :8000/api/v1/analytics/overview Authorization:'Bearer invalid_token'
```

---

## 5. Analytics Export (GET /api/v1/analytics/export)

Authorization: Super Admin, Head of HR
Query Parameters:

- format: csv or json (optional)
- period, include_jobs, include_departments (optional)

### Example Variations

1. Export analytics as CSV (default)

```sh
http GET :8000/api/v1/analytics/export Authorization:'Bearer <ADMIN_TOKEN>'
```

2. Export analytics as JSON

```sh
http GET :8000/api/v1/analytics/export?format=json Authorization:'Bearer <ADMIN_TOKEN>'
```

3. Export analytics for 30-day period, include jobs and departments

```sh
http GET :8000/api/v1/analytics/export?period=30d&include_jobs=true&include_departments=true Authorization:'Bearer <ADMIN_TOKEN>'
```

4. Export analytics with invalid format (should return 422)

```sh
http GET :8000/api/v1/analytics/export?format=xml Authorization:'Bearer <ADMIN_TOKEN>'
```

5. Export analytics with insufficient permissions (should return 403)

```sh
http GET :8000/api/v1/analytics/export Authorization:'Bearer <HR_TOKEN>'
```
