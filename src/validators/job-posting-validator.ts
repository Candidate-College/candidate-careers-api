import {
  JOB_TYPE_ENUM,
  EMPLOYMENT_LEVEL_ENUM,
  PRIORITY_LEVEL_ENUM,
  JOB_STATUS_ENUM,
  JOB_TITLE_MIN,
  JOB_TITLE_MAX,
  JOB_DESCRIPTION_MIN,
  JOB_DESCRIPTION_MAX,
  JOB_REQUIREMENTS_MIN,
  JOB_REQUIREMENTS_MAX,
  JOB_RESPONSIBILITIES_MIN,
  JOB_RESPONSIBILITIES_MAX,
  JOB_BENEFITS_MAX,
  JOB_TEAM_INFO_MAX,
  JOB_MAX_APPLICATIONS_MIN,
  JOB_MAX_APPLICATIONS_MAX,
} from '@/constants/job-posting-constant';

const jobValidator = {
  title: {
    type: 'string',
    min: JOB_TITLE_MIN,
    max: JOB_TITLE_MAX,
    noHTML: true,
    description: 'Should not contain HTML tags.',
  },
  department_id: { type: 'number', positive: true, int: true },
  job_category_id: { type: 'number', positive: true, int: true },
  job_type: {
    type: 'enum',
    values: [...JOB_TYPE_ENUM],
  },
  employment_level: {
    type: 'enum',
    values: [...EMPLOYMENT_LEVEL_ENUM],
  },
  priority_level: {
    type: 'enum',
    values: [...PRIORITY_LEVEL_ENUM],
    optional: true,
    default: 'normal',
  },
  description: {
    type: 'string',
    min: JOB_DESCRIPTION_MIN,
    max: JOB_DESCRIPTION_MAX,
    allowHTML: true,
  },
  requirements: {
    type: 'string',
    min: JOB_REQUIREMENTS_MIN,
    max: JOB_REQUIREMENTS_MAX,
    allowHTML: true,
  },
  responsibilities: {
    type: 'string',
    min: JOB_RESPONSIBILITIES_MIN,
    max: JOB_RESPONSIBILITIES_MAX,
    allowHTML: true,
  },
  benefits: { type: 'string', max: JOB_BENEFITS_MAX, optional: true },
  team_info: { type: 'string', max: JOB_TEAM_INFO_MAX, optional: true },
  status: {
    type: 'enum',
    values: [...JOB_STATUS_ENUM],
    optional: true,
    default: 'draft',
  },
  application_deadline: {
    type: 'date',
    futureOnly: true,
    optional: true,
  },
  max_applications: {
    type: 'number',
    min: JOB_MAX_APPLICATIONS_MIN,
    max: JOB_MAX_APPLICATIONS_MAX,
    int: true,
    optional: true,
  },
};

export default jobValidator;
