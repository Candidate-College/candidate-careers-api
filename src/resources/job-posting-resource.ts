import { Job } from '@/models/job-model';

export class JobResource {
  /**
   * Private base serializer containing fields common to all job responses.
   * @param job - The job object from the database.
   * @returns A base serialized job object.
   */
  private static _baseSerializer(job: Job) {
    return {
      uuid: job.uuid,
      title: job.title,
      slug: job.slug,
      job_type: job.job_type,
      employment_level: job.employment_level,
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,
      benefits: job.benefits,
      team_info: job.team_info,
      status: job.status,
      views_count: job.views_count,
      application_deadline: job.application_deadline,
      max_applications: job.max_applications,
      published_at: job.published_at,
    };
  }

  /**
   * Serializes a complete, flat job object for internal use or full responses.
   * @param job - The job object from the database.
   * @returns A fully serialized job object without relations.
   */
  static serialize(job: Job) {
    return {
      ...this._baseSerializer(job),
      id: job.id,
      department_id: job.department_id,
      job_category_id: job.job_category_id,
      priority_level: job.priority_level,
      applications_count: job.applications_count,
      created_by: job.created_by,
      created_at: job.created_at,
      updated_at: job.updated_at,
    };
  }

  /**
   * Formats the response for the public-facing "Get by Slug" endpoint.
   * Excludes sensitive or internal-only fields.
   * @param job - The job object, including 'departments' and 'job_categories' relations.
   * @returns A serialized job object suitable for public consumption.
   */
  static getPublicJobBySlugResponse(job: Job) {
    return {
      ...this._baseSerializer(job),
      departments: job.departments,
      job_categories: job.job_categories,
    };
  }

  /**
   * Formats the response for the authenticated "Get by UUID" endpoint.
   * Includes all job fields and specified relational data.
   * @param job - The job object, including any requested relations.
   * @returns A fully serialized job object with its relations.
   */
  static getJobByUUIDResponse(job: Job) {
    return {
      ...this.serialize(job),
      departments: job.departments,
      job_categories: job.job_categories,
      creator: job.created_by_user,
    };
  }
}
