import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`CREATE TYPE email_notification_status AS ENUM ('pending', 'sent', 'failed', 'bounced')`);

  await knex.schema.createTable('email_notifications', table => {
    table.increments('id');
    table.string('recipient_email', 255).notNullable();
    table.string('recipient_name', 255);
    table.string('sender_email', 255).notNullable();
    table.string('subject', 500).notNullable();
    table.text('body').notNullable();
    table.string('template_name', 100);
    table.json('template_data');
    table.string('related_type', 100);
    table.integer('related_id');
    table.specificType('status', 'email_notification_status').defaultTo('pending');
    table.timestamp('sent_at').defaultTo(knex.fn.now());
    table.text('failed_reason');
    table.integer('attempts').defaultTo(0);
    table.integer('max_attempts').defaultTo(3);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('email_notifications');
  await knex.schema.raw('DROP TYPE IF EXISTS email_notification_status');
}
