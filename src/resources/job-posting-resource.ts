import { Job } from '@/models/job-model';

export class JobResource {
  static serialize(job: Job) {
    return {
      id: job.id,
      uuid: job.uuid,
      title: job.title,
      slug: job.slug,
      department_id: job.department_id,
      job_category_id: job.job_category_id,
      job_type: job.job_type,
      employment_level: job.employment_level,
      priority_level: job.priority_level,
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,
      benefits: job.benefits,
      team_info: job.team_info,
      status: job.status,
      views_count: job.views_count,
      applications_count: job.applications_count,
      application_deadline: job.application_deadline,
      max_applications: job.max_applications,
      published_at: job.published_at,
      created_by: job.created_by,
      created_at: job.created_at,
      updated_at: job.updated_at,
    };
  }
}
