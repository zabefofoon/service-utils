import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { and, eq } from "drizzle-orm"
import { calendar_v3, google } from "googleapis"
import { CommonResponse } from "../common/models/CommonResponse"
import { ISO_TO_GCAL, ISO_TO_LANG } from "../const"
import { PostgresService } from "../database/postgres.service"
import { holidays } from "../database/schema"

dayjs.extend(utc)

export interface HolidayItem {
  summary: string
  date?: string
}

interface GoogleApiLikeError {
  response?: {
    status?: number
  }
}

@Injectable()
export class HolidayService {
  constructor(private readonly postgresService: PostgresService) {}
  private getCalendarClient(): calendar_v3.Calendar {
    const apiKey = process.env.GOOGLE_API_KEY

    if (!apiKey) throw new InternalServerErrorException("GOOGLE_API_KEY is not configured")

    return google.calendar({ version: "v3", auth: apiKey })
  }

  async findAll(query: { year: number; country?: string }): Promise<CommonResponse<HolidayItem[]>> {
    const calendarId = `${ISO_TO_LANG[query.country || "ko"]}.${ISO_TO_GCAL[query.country || "kr"]}.official#holiday@group.v.calendar.google.com`

    const year = this.parseYear(query.year)

    const start = dayjs.utc().year(year).month(0).date(1).startOf("day")
    const end = start.add(1, "year")

    try {
      const calendar = this.getCalendarClient()
      const response = await calendar.events.list({
        calendarId,
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 2500,
      })

      return CommonResponse.of({
        data: (response.data.items ?? []).map((event) => this.toHolidayItem(event)),
        message: "success",
        statusCode: HttpStatus.OK,
      })
    } catch (error) {
      this.handleGoogleApiError(error)
    }
  }

  async find(year: number, country: string) {
    const holiday = await this.postgresService
      .getDb()
      .select()
      .from(holidays)
      .where(and(eq(holidays.year, year), eq(holidays.country, country)))

    return CommonResponse.of({
      data: holiday,
      statusCode: HttpStatus.OK,
    })
  }

  async saveHolidayFromGoogle(year: number, country?: string) {
    if (!year) throw new BadRequestException("need year")

    if (year && country) {
      const res = await this.findAll({ year, country })

      const insertRes = await this.postgresService
        .getDb()
        .insert(holidays)
        .values({
          year: Number(year),
          country,
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
    } else if (year) {
      for (const country of Object.keys(ISO_TO_GCAL)) {
        const res = await this.findAll({ country, year })

        await this.postgresService
          .getDb()
          .insert(holidays)
          .values({ year, country, holidays: res.data })
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
    }
  }

  async deleteHoliday(year: number) {
    if (!year) throw new BadRequestException("need year")

    if (year < 1900 || year > 2100)
      throw new BadRequestException("year must be an integer between 1900 and 2100")
    try {
      await this.postgresService.getDb().delete(holidays).where(eq(holidays.year, year))
      return CommonResponse.of({
        data: undefined,
        message: "success",
        statusCode: HttpStatus.OK,
      })
    } catch {
      throw new InternalServerErrorException("fail delete")
    }
  }

  private parseYear(input?: number): number {
    if (!input) return dayjs.utc().year()

    const parsedYear = input

    if (parsedYear < 1900 || parsedYear > 2100)
      throw new BadRequestException("year must be an integer between 1900 and 2100")

    return parsedYear
  }

  private toHolidayItem(event: calendar_v3.Schema$Event): HolidayItem {
    return {
      summary: event.summary ?? "",
      date: event.start?.date ?? event.start?.dateTime ?? "",
    }
  }

  private handleGoogleApiError(error: unknown, eventId?: string): never {
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error
    }

    if (this.hasGoogleApiStatus(error, 404)) {
      if (eventId) {
        throw new NotFoundException(`Holiday event ${eventId} not found`)
      }

      throw new NotFoundException("Holiday calendar not found")
    }

    if (this.hasGoogleApiStatus(error, 401) || this.hasGoogleApiStatus(error, 403)) {
      throw new InternalServerErrorException("Google Calendar API authentication failed")
    }

    throw new ServiceUnavailableException("Failed to fetch holidays from Google Calendar")
  }

  private hasGoogleApiStatus(error: unknown, status: number): boolean {
    if (typeof error !== "object" || error === null || !("response" in error)) {
      return false
    }

    const apiError = error as GoogleApiLikeError
    return apiError.response?.status === status
  }
}
