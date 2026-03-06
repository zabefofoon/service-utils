CREATE TABLE IF NOT EXISTS "board" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "holiday" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "holiday_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"year" integer NOT NULL,
	"country" text NOT NULL,
	"holidays" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sync_failed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "holiday" ADD COLUMN IF NOT EXISTS "sync_failed" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "holiday_year_country_uq" ON "holiday" USING btree ("year","country");
