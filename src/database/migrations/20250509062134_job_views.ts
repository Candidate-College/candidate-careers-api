import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {  
  await knex.schema.createTable('job_views', table => {
    table.increments('id');
    table.integer('job_posting_id').unsigned().references('id').inTable('job_postings').onDelete('CASCADE');
    table.string('ip_address', 45).notNullable();
    table.text('user_agent');
    table.string('referrer', 1000);
    table.string('session_id', 255);
    table.timestamp('viewed_at', { useTz: true }).defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('job_views');
}
