import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from 'drizzle-orm/sqlite-core';
export const sessions = sqliteTable(
  'demo_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    username: text('username').notNull(),
    expires: integer('expires').notNull(),
  },
  (t) => [index('session_expiry').on(t.expires)],
);
export const catalog = sqliteTable(
  'account_catalog',
  {
    username: text('username').notNull(),
    id: text('id').notNull(),
    record: text('record').notNull(),
  },
  (t) => [primaryKey({ columns: [t.username, t.id] })],
);
export const attempts = sqliteTable('login_attempts', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expires: integer('expires').notNull(),
});
