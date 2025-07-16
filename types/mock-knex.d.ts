declare module 'mock-knex' {
  import { Knex } from 'knex';

  interface Tracker {
    install(): void;
    uninstall(): void;
    on(event: 'query', handler: (query: any, step?: number) => void): void;
  }

  export function mock(knex: Knex): void;
  export function unmock(knex: Knex): void;
  export function getTracker(): Tracker;
}
