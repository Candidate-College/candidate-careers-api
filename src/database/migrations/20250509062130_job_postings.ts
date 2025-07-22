import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(
    `CREATE TYPE job_posting_type AS ENUM ('internship', 'staff', 'freelance', 'contract')`,
  );
  await knex.schema.raw(`
    CREATE TYPE job_posting_employment_level AS ENUM
    ('entry', 'junior', 'mid', 'senior', 'lead', 'head', 'co_head')
  `);
  await knex.schema.raw(`CREATE TYPE job_posting_priority_level AS ENUM ('normal', 'urgent')`);
  await knex.schema.raw(`
    CREATE TYPE job_posting_status AS ENUM
    ('draft', 'published', 'closed', 'archived')
  `);

  await knex.schema.createTable('job_postings', table => {
    table.increments('id');
    table.uuid('uuid').notNullable().defaultTo(knex.raw('gen_random_uuid()')).unique();
    table.string('title').notNullable();
    table.string('slug').unique();
    table
      .integer('department_id')
      .unsigned()
      .references('id')
      .inTable('departments')
      .onDelete('CASCADE');
    table
      .integer('job_category_id')
      .unsigned()
      .references('id')
      .inTable('job_categories')
      .onDelete('CASCADE');
    table.specificType('job_type', 'job_posting_type');
    table.specificType('employment_level', 'job_posting_employment_level');
    table.specificType('priority_level', 'job_posting_priority_level').defaultTo('normal');
    table.text('description').notNullable();
    table.text('requirements').notNullable();
    table.text('responsibilities').notNullable();
    table.text('benefits');
    table.text('team_info');
    table.decimal('salary_min', 15, 2);
    table.decimal('salary_max', 15, 2);
    table.boolean('is_salary_negotiable').defaultTo(false);
    table.string('location', 255);
    table.boolean('is_remote').defaultTo(false);
    table.date('application_deadline');
    table.integer('max_applications');
    table.specificType('status', 'job_posting_status').defaultTo('draft');
    table.integer('views_count').defaultTo(0);
    table.integer('applications_count').defaultTo(0);
    table.timestamp('published_at', { useTz: true });
    table.timestamp('closed_at', { useTz: true });
    table.integer('created_by').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('updated_by').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true });

    table.index(['uuid']);
    table.index(['slug']);
    table.index(['status']);
    table.index(['deleted_at'], 'idx_job_postings_deleted_at');
    table.index(['deleted_at', 'status'], 'idx_job_postings_deleted_status');
  });

  await knex.schema.raw(`
    CREATE VIEW active_job_postings AS
    SELECT * FROM job_postings where deleted_at IS NULL;`)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP VIEW IF EXISTS active_job_postings');
  await knex.schema.dropTableIfExists('job_postings');
  await knex.schema.raw('DROP TYPE IF EXISTS job_posting_type');
  await knex.schema.raw('DROP TYPE IF EXISTS job_posting_employment_level');
  await knex.schema.raw('DROP TYPE IF EXISTS job_posting_priority_level');
  await knex.schema.raw('DROP TYPE IF EXISTS job_posting_status');
}
