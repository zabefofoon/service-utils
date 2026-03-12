import { z } from "zod"

export const SHEMA_WEATHER_QUERY = z
  .object({
    lat: z.preprocess((value) => {
      if (value === undefined || value === null) return undefined
      if (typeof value === "string" && value.trim() === "") return undefined
      return value
    }, z.coerce.number().min(-90, "lat must be between -90 and 90").max(90, "lat must be between -90 and 90").optional()),
    lon: z.preprocess((value) => {
      if (value === undefined || value === null) return undefined
      if (typeof value === "string" && value.trim() === "") return undefined
      return value
    }, z.coerce.number().min(-180, "lon must be between -180 and 180").max(180, "lon must be between -180 and 180").optional()),
    geonameId: z.preprocess((value) => {
      if (value === undefined || value === null) return undefined
      if (typeof value === "string" && value.trim() === "") return undefined
      return value
    }, z.coerce.number().int().positive("geoname_id/geogeoname_id must be a positive number").optional()),
  })
  .superRefine((value, ctx) => {
    if (value.geonameId === undefined) {
      if (value.lat === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lat"],
          message: "lat is required when geoname_id/geogeoname_id is not provided",
        })
      }
      if (value.lon === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lon"],
          message: "lon is required when geoname_id/geogeoname_id is not provided",
        })
      }
    }
  })

export const SCHEMA_COORDINATE = z.object({
  lat: z
    .number()
    .min(-90, "lat must be between -90 and 90")
    .max(90, "lat must be between -90 and 90"),
  lon: z
    .number()
    .min(-180, "lon must be between -180 and 180")
    .max(180, "lon must be between -180 and 180"),
})

export const SCHEMA_CITY_WEATHER_PAYLOAD = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string(),
  })
  .loose()
