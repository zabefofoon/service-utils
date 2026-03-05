import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const boards = pgTable('board', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type Board = typeof boards.$inferSelect;
