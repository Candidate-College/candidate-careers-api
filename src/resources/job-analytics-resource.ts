/**
 * Job Analytics Resource
 *
 * Serializes job analytics data for API responses.
 * Formats analytics, metrics, and insights into the expected response shape.
 *
 * @module resources/job-analytics-resource
 */

export function toJobAnalyticsResource(analytics: any, metrics: any, insights: any) {
  return {
    analytics,
    metrics,
    insights,
  };
}
