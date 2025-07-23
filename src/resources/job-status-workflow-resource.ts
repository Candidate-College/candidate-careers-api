/**
 * Job Status Workflow Resource
 *
 * Serializes job status workflow API responses, including transition info and result formatting.
 *
 * @module resources/job-status-workflow-resource
 */

export class JobStatusWorkflowResource {
  /**
   * Serialize success response for single transition
   */
  static successResponse(to: string, from: string) {
    return {
      status: 200,
      message: `Job status changed from ${from} to ${to} successfully`,
      data: {
        transition: {
          from_status: from,
          to_status: to,
        },
      },
    };
  }

  /**
   * Serialize bulk operation response
   */
  static bulkResponse(results: { jobId: number; success: boolean; error?: string }[]) {
    return {
      status: 200,
      message: 'Bulk job status update completed',
      data: results,
    };
  }
}
