// Allowed HTML tags and attributes for job posting fields
export const ALLOWED_HTML_TAGS = ['b', 'i', 'u', 'a', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'em'];
export const ALLOWED_HTML_ATTR = ['href', 'title', 'target'];

// Enum values for job posting fields
export const JOB_TYPE_ENUM = ['internship', 'staff', 'freelance', 'contract'] as const;
export const EMPLOYMENT_LEVEL_ENUM = [
  'entry',
  'junior',
  'mid',
  'senior',
  'lead',
  'head',
  'co_head',
] as const;
export const PRIORITY_LEVEL_ENUM = ['normal', 'urgent'] as const;
export const JOB_STATUS_ENUM = ['draft', 'published'] as const;

// Min/max constraints for job posting fields
export const JOB_TITLE_MIN = 5;
export const JOB_TITLE_MAX = 255;
export const JOB_DESCRIPTION_MIN = 50;
export const JOB_DESCRIPTION_MAX = 10000;
export const JOB_REQUIREMENTS_MIN = 20;
export const JOB_REQUIREMENTS_MAX = 5000;
export const JOB_RESPONSIBILITIES_MIN = 20;
export const JOB_RESPONSIBILITIES_MAX = 5000;
export const JOB_BENEFITS_MAX = 3000;
export const JOB_TEAM_INFO_MAX = 2000;
export const JOB_MAX_APPLICATIONS_MIN = 1;
export const JOB_MAX_APPLICATIONS_MAX = 10000;
