/**
 * Defines the shape of the payload for updating a job posting.
 * All fields are optional except for 'version' for optimistic locking.
 */
export interface IJobUpdatePayload {
    title?: string;
    department_id?: number;
    job_category_id?: number;
    job_type?: 'internship' | 'staff' | 'freelance' | 'contract';
    employment_level?: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'head' | 'co_head';
    priority_level?: 'normal' | 'urgent';
    description?: string;
    requirements?: string;
    responsibilities?: string;
    benefits?: string;
    team_info?: string;
    application_deadline?: string | Date;
    max_applications?: number;
    version: number;
}