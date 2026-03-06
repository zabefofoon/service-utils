import { sql } from "drizzle-orm"
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const boards = pgTable("board", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
})

export type Board = typeof boards.$inferSelect

export const holidays = pgTable(
  "holiday",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    year: integer("year").notNull(),
    country: text("country").notNull(), // 필요하면 varchar/char(2)로 제한
    holidays: jsonb("holidays")
      .$type<Array<{ summary: string; date?: string }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    syncFailed: boolean("sync_failed").notNull().default(false),
  },
  (t) => [uniqueIndex("holiday_year_country_uq").on(t.year, t.country)]
)

export type Holiday = typeof holidays.$inferSelect
