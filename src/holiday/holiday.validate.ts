import { z } from "zod"
import { ISO_TO_GCAL } from "../const"

const COUNTRY_CODES = Object.keys(ISO_TO_GCAL) as [
  keyof typeof ISO_TO_GCAL,
  ...(keyof typeof ISO_TO_GCAL)[],
]

export const SCHEMA_HOLIDAY_YEAR = z
  .number()
  .int("year must be an integer between 1900 and 2100")
  .min(1900, "year must be an integer between 1900 and 2100")
  .max(2100, "year must be an integer between 1900 and 2100")

export const SCHEMA_HOLIDAY_COUNTRY = z.enum(COUNTRY_CODES)

export const SCHEMA_HOLIDAY_FIND_ALL_QUERY = z.object({
  year: SCHEMA_HOLIDAY_YEAR,
  country: SCHEMA_HOLIDAY_COUNTRY.optional(),
})

export const SCHEMA_HOLIDAY_FIND_QUERY = z.object({
  year: SCHEMA_HOLIDAY_YEAR,
  country: SCHEMA_HOLIDAY_COUNTRY,
})

export const SCHEMA_HOLIDAY_DELETE_QUERY = z.object({
  year: SCHEMA_HOLIDAY_YEAR,
})
