import { z } from "zod"
import { throwZodBadRequest } from "../common/utils/zod.utils"

interface WeatherQueryParams {
  lat?: string
  lon?: string
  geonameId?: string
}

interface CoordinatesParams {
  lat: number
  lon: number
}

const optionalLatFromQuery = z.preprocess((value) => {
  if (value === undefined || value === null) return undefined
  if (typeof value === "string" && value.trim() === "") return undefined
  return value
}, z.coerce.number().min(-90, "lat must be between -90 and 90").max(90, "lat must be between -90 and 90").optional())

const optionalLonFromQuery = z.preprocess((value) => {
  if (value === undefined || value === null) return undefined
  if (typeof value === "string" && value.trim() === "") return undefined
  return value
}, z.coerce.number().min(-180, "lon must be between -180 and 180").max(180, "lon must be between -180 and 180").optional())

const optionalGeonameIdFromQuery = z.preprocess((value) => {
  if (value === undefined || value === null) return undefined
  if (typeof value === "string" && value.trim() === "") return undefined
  return value
}, z.coerce.number().int().positive("geoname_id/geogeoname_id must be a positive number").optional())

const weatherQuerySchema = z
  .object({
    lat: optionalLatFromQuery,
    lon: optionalLonFromQuery,
    geonameId: optionalGeonameIdFromQuery,
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

const coordinateSchema = z.object({
  lat: z
    .number()
    .min(-90, "lat must be between -90 and 90")
    .max(90, "lat must be between -90 and 90"),
  lon: z
    .number()
    .min(-180, "lon must be between -180 and 180")
    .max(180, "lon must be between -180 and 180"),
})

const cityWeatherPayloadSchema = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string(),
  })
  .loose()

export default {
  parseWeatherQuery(params: WeatherQueryParams) {
    try {
      return weatherQuerySchema.parse(params)
    } catch (error) {
      throwZodBadRequest(error)
    }
  },

  hasUsableWeatherPayload(payload: unknown) {
    return cityWeatherPayloadSchema.safeParse(payload).success
  },

  parseCoordinates(params: CoordinatesParams) {
    try {
      return coordinateSchema.parse(params)
    } catch (error) {
      throwZodBadRequest(error)
    }
  },
}
