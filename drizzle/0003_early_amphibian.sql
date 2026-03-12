UPDATE "city"
SET "geog" = ST_SetSRID(ST_MakePoint("lon", "lat"), 4326)::geography
WHERE "geog" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "city_geog_gix" ON "city" USING gist ("geog");
