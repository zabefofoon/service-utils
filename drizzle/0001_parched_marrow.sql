CREATE TABLE IF NOT EXISTS "city"(
    "geoname_id" bigint PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "country_code" text NOT NULL,
    "lat" double precision NOT NULL,
    "lon" double precision NOT NULL,
    "timezone" text
);

