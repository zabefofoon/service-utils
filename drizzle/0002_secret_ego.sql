CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
ALTER TABLE "city" ADD COLUMN IF NOT EXISTS "geog" geography(Point,4326);
