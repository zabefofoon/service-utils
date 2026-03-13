import { sql } from "drizzle-orm"
import {
  bigint,
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

const geographyPoint = customType<{ data: string }>({
  dataType() {
    return "geography(Point,4326)"
  },
})

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

export const cities = pgTable(
  "city",
  {
    geonameId: bigint("geoname_id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    countryCode: text("country_code").notNull(),
    lat: doublePrecision("lat").notNull(),
    lon: doublePrecision("lon").notNull(),
    geog: geographyPoint("geog"),
    timezone: text("timezone"),
  },
  (t) => [
    index("city_geog_gix").using("gist", t.geog),
    index("city_lat_lon_idx").on(t.lat, t.lon),
  ]
)

export type City = typeof cities.$inferSelect

export const cityWeather = pgTable(
  "city_weather",
  {
    geonameId: bigint("geoname_id", { mode: "number" })
      .primaryKey()
      .references(() => cities.geonameId, { onDelete: "cascade", onUpdate: "cascade" }),
    weatherPayload: jsonb("weather_payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    active: boolean("active").notNull().default(false),
    lastRequestedAt: timestamp("last_requested_at", { withTimezone: true, mode: "date" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("city_weather_active_idx").on(t.active),
    index("city_weather_expires_at_idx").on(t.expiresAt),
    index("city_weather_last_requested_at_idx").on(t.lastRequestedAt),
  ]
)

export type CityWeather = typeof cityWeather.$inferSelect
