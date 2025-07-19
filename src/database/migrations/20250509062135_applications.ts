import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    CREATE TYPE application_status AS ENUM
    ('pending', 'under_review', 'approved', 'rejected')
  `);

  await knex.schema.createTable('applications', table => {
    table.increments('id');
    table.uuid('uuid').notNullable().defaultTo(knex.raw('gen_random_uuid()')).unique();
    table.integer('job_posting_id').unsigned().references('id').inTable('job_postings').onDelete('CASCADE');
    table.string('application_number', 50).notNullable();
    table.string('email', 255).notNullable();
    table.string('full_name', 255).notNullable();
    table.string('domicile', 255).notNullable();
    table.string('university', 255).notNullable();
    table.string('major', 255).notNullable();
    table.string('semester', 10).notNullable();

    table.string('instagram_url', 500);
    table.string('whatsapp_number', 20).notNullable();
    table.string('cv_url', 1000).notNullable();
    table.string('cv_filename', 255).notNullable();
    table.string('portfolio_url', 1000);
    table.string('portfolio_filename', 255);

    table.string('proof_follow_cc_ig_url', 1000).notNullable();
    table.string('proof_follow_cc_ig_filename', 255).notNullable();
    table.string('proof_follow_cc_tiktok_url', 1000).notNullable();
    table.string('proof_follow_cc_tiktok_filename', 255).notNullable();
    table.string('proof_follow_cc_x_url', 1000).notNullable();
    table.string('proof_follow_cc_x_filename', 255).notNullable();
    table.string('proof_follow_ig_sequoia_url', 1000).notNullable();
    table.string('proof_follow_ig_sequoia_filename', 255).notNullable();
    table.string('proof_follow_ig_sm_url', 1000).notNullable();
    table.string('proof_follow_ig_sm_filename', 255).notNullable();

    table.specificType('status', 'application_status').defaultTo('pending');
    table.text('rejection_reason');
    table.timestamp('approved_at', { useTz: true });
    table.timestamp('rejected_at', { useTz: true });
    table.integer('reviewed_by').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('reviewed_at', { useTz: true });
    table.boolean('approval_email_sent').defaultTo(false);
    table.timestamp('approval_email_sent_at', { useTz: true });
    table.string('ip_address', 45);
    table.text('user_agent');
    table.string('source', 100).defaultTo('website');

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true });

    table.index(['uuid']);
    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('applications');
  await knex.schema.raw('DROP TYPE IF EXISTS application_status');
}
