CREATE INDEX "city_lat_lon_idx" ON "city" USING btree ("lat","lon");--> statement-breakpoint
CREATE INDEX "city_weather_last_requested_at_idx" ON "city_weather" USING btree ("last_requested_at");