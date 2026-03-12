import { HttpStatus, Injectable, InternalServerErrorException } from "@nestjs/common"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { and, eq } from "drizzle-orm"
import { CommonResponse } from "../common/models/CommonResponse"
import zodUtils from "../common/utils/zod.utils"
import { ISO_TO_GCAL, ISO_TO_LANG } from "../const"
import { PostgresService } from "../database/postgres.service"
import { holidays } from "../database/schema"
import { GoogleCalendarClient } from "../infra/google-calendar.client"
import {
  SCHEMA_HOLIDAY_DELETE_QUERY,
  SCHEMA_HOLIDAY_FIND_ALL_QUERY,
  SCHEMA_HOLIDAY_FIND_QUERY,
} from "./holiday.validate"
import { HolidayItem } from "./models/HolidayItem"

dayjs.extend(utc)

@Injectable()
export class HolidayService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly googleCalendarClient: GoogleCalendarClient
  ) {}

  async findAll(query: { year: number; country?: string }): Promise<CommonResponse<HolidayItem[]>> {
    try {
      const parsed = SCHEMA_HOLIDAY_FIND_ALL_QUERY.parse(query)
      const country = parsed.country ?? "kr"
      const calendarId = `${ISO_TO_LANG[country]}.${ISO_TO_GCAL[country]}.official#holiday@group.v.calendar.google.com`
      const start = dayjs.utc().year(parsed.year).month(0).date(1).startOf("day")
      const end = start.add(1, "year")
      const holidayItems = await this.googleCalendarClient.listHolidayEvents({
        calendarId,
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
      })

      return CommonResponse.of({
        data: holidayItems,
        message: "success",
        statusCode: HttpStatus.OK,
      })
    } catch (error) {
      zodUtils.throwZodBadRequest(error)
      throw error
    }
  }

  async find(year: number, country: string) {
    try {
      const parsed = SCHEMA_HOLIDAY_FIND_QUERY.parse({ year, country })
      const holiday = await this.postgresService
        .getDb()
        .select()
        .from(holidays)
        .where(and(eq(holidays.year, parsed.year), eq(holidays.country, parsed.country)))

      return CommonResponse.of({
        data: holiday,
        statusCode: HttpStatus.OK,
      })
    } catch (error) {
      zodUtils.throwZodBadRequest(error)
    }
  }

  async saveHolidayFromGoogle(year: number, country?: string) {
    try {
      const parsed = SCHEMA_HOLIDAY_FIND_ALL_QUERY.parse({ year, country })

      if (parsed.country) {
        const res = await this.findAll(parsed)

        const insertRes = await this.postgresService
          .getDb()
          .insert(holidays)
          .values({
            year: parsed.year,
            country: parsed.country,
            holidays: res.data,
          })
          .onConflictDoUpdate({
            target: [holidays.year, holidays.country],
            set: {
              holidays: res.data,
              updatedAt: new Date(),
            },
          })
          .returning()

        return CommonResponse.of({
          data: insertRes,
          message: "success",
          statusCode: HttpStatus.OK,
        })
      }

      for (const country of Object.keys(ISO_TO_GCAL)) {
        const res = await this.findAll({ country, year: parsed.year })

        await this.postgresService
          .getDb()
          .insert(holidays)
          .values({ year: parsed.year, country, holidays: res.data })
          .onConflictDoUpdate({
            target: [holidays.year, holidays.country],
            set: { holidays: res.data, updatedAt: new Date() },
          })
      }

      console.log(`[cron] HolidayService ${new Date().toISOString()} every-minute job`)
      return CommonResponse.of({
        data: [],
        message: "success",
        statusCode: HttpStatus.OK,
      })
    } catch (error) {
      zodUtils.throwZodBadRequest(error)
    }
  }

  async deleteHoliday(year: number) {
    try {
      const parsed = SCHEMA_HOLIDAY_DELETE_QUERY.parse({ year })
      await this.postgresService.getDb().delete(holidays).where(eq(holidays.year, parsed.year))
      return CommonResponse.of({
        data: undefined,
        message: "success",
        statusCode: HttpStatus.OK,
      })
    } catch {
      throw new InternalServerErrorException("fail delete")
    }
  }
}
