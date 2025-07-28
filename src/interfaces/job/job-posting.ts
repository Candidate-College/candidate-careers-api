export interface DeleteJobOptions {
    force?: boolean;
    preserveApplications?: boolean;
}

export interface DeletedJobData {
    uuid: string;
    title: string;
    status: string;
    deleted_at: Date;
    deleted_by: number;
}

export interface RelatedData {
    applications_preserved: number;
    notes_preserved: number;
    views_count_archived: number;
}

export interface RecoveryInfo {
    recovery_possible: boolean;
    recovery_deadline: Date;
}

export interface DeleteJobResponse {
    deleted_job: DeletedJobData;
    related_data: RelatedData;
    recovery_info: RecoveryInfo;
}

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