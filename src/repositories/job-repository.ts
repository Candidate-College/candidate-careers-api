// src/repositories/job-repository.ts
import { Job } from '@/models/job-model';
import { JobCategory } from '@/models/job-category-model';
import { Department } from '@/models/department-model';

export class JobRepository {
  static async create(jobData: Partial<Job>): Promise<Job> {
    return await Job.query().insert(jobData).returning('*');
  }

  static async slugExists(slug: string): Promise<boolean> {
    const result = await Job.query().select('id').findOne({ slug });
    return !!result;
  }

  static async isDepartmentActive(id: number): Promise<boolean> {
    const department = await Department.query().findById(id);
    return !!department && department.status === 'active';
  }

  static async isJobCategoryActive(id: number): Promise<boolean> {
    const category = await JobCategory.query().findById(id);
    return !!category && category.status === 'active';
  }
}
