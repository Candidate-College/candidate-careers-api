import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('job_postings', (table) => {
        table.integer('version').notNullable().defaultTo(1);
        table.index(['uuid', 'version'], 'idx_job_postings_version');
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('job_postings', (table) => {
        table.dropIndex('idx_job_postings_version');
        table.dropColumn('version');
    });
}

