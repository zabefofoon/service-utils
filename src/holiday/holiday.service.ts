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
import { calendar_v3, google } from "googleapis"
import { CommonResponse } from "../common/models/CommonResponse"
import { ISO_TO_GCAL, ISO_TO_LANG } from "../const"

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
  private getCalendarClient(): calendar_v3.Calendar {
    const apiKey = process.env.GOOGLE_API_KEY

    if (!apiKey) throw new InternalServerErrorException("GOOGLE_API_KEY is not configured")

    return google.calendar({ version: "v3", auth: apiKey })
  }

  async findAll(query: {
    country?: string
    year?: string
  }): Promise<CommonResponse<HolidayItem[]>> {
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

      const items = (response.data.items ?? []).map((event) => this.toHolidayItem(event))

      return CommonResponse.of({
        data: items,
        message: "success",
        statusCode: HttpStatus.OK,
      })
    } catch (error) {
      this.handleGoogleApiError(error)
    }
  }

  getHolidayFromGoogle() {
    console.log(`[cron] HolidayService ${new Date().toISOString()} every-minute job`)
  }

  private parseYear(input?: string): number {
    if (!input) return dayjs.utc().year()

    const parsedYear = Number(input)

    if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 2100)
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
