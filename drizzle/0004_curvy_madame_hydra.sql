CREATE TABLE IF NOT EXISTS "city_weather"(
    "geoname_id" bigint PRIMARY KEY NOT NULL,
    "weather_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "active" boolean DEFAULT FALSE NOT NULL,
    "last_requested_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
ALTER TABLE "city_weather"
    ADD CONSTRAINT "city_weather_geoname_id_city_geoname_id_fk" FOREIGN KEY ("geoname_id") REFERENCES "public"."city"("geoname_id") ON DELETE CASCADE ON UPDATE CASCADE;

--> statement-breakpoint
CREATE INDEX "city_weather_active_idx" ON "city_weather" USING btree("active");

--> statement-breakpoint
CREATE INDEX "city_weather_expires_at_idx" ON "city_weather" USING btree("expires_at");

