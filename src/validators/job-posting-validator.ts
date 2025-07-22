const jobValidator = {
  title: {
    type: 'string',
    min: 5,
    max: 255,
    description: 'Should not contain HTML tags.',
  },
  department_id: { type: 'number', positive: true, int: true },
  job_category_id: { type: 'number', positive: true, int: true },
  job_type: {
    type: 'enum',
    values: ['internship', 'staff', 'freelance', 'contract'],
  },
  employment_level: {
    type: 'enum',
    values: ['entry', 'junior', 'mid', 'senior', 'lead', 'head', 'co_head'],
  },
  priority_level: {
    type: 'enum',
    values: ['normal', 'urgent'],
    optional: true,
  },
  description: { type: 'string', min: 50, max: 10000 },
  requirements: { type: 'string', min: 20, max: 5000 },
  responsibilities: { type: 'string', min: 20, max: 5000 },
  benefits: { type: 'string', max: 3000, optional: true },
  team_info: { type: 'string', max: 2000, optional: true },
  status: {
    type: 'enum',
    values: ['draft', 'published'],
    optional: true,
  },
  application_deadline: { type: 'date', futureOnly: true, optional: true },
  max_applications: {
    type: 'number',
    min: 1,
    max: 10000,
    int: true,
    optional: true,
  },
};

export default jobValidator;
