import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common"
import { calendar_v3, google } from "googleapis"
import { HolidayItem } from "../holiday/models/HolidayItem"

interface GoogleApiLikeError {
  response?: {
    status?: number
  }
}

@Injectable()
export class GoogleCalendarClient {
  private getCalendarClient(): calendar_v3.Calendar {
    const apiKey = process.env.GOOGLE_API_KEY

    if (!apiKey) throw new InternalServerErrorException("GOOGLE_API_KEY is not configured")

    return google.calendar({ version: "v3", auth: apiKey })
  }

  async listHolidayEvents(params: {
    calendarId: string
    timeMin: string
    timeMax: string
  }): Promise<HolidayItem[]> {
    try {
      const calendar = this.getCalendarClient()
      const response = await calendar.events.list({
        calendarId: params.calendarId,
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 2500,
      })

      return (response.data.items ?? []).map((event) => ({
        summary: event.summary ?? "",
        date: event.start?.date ?? event.start?.dateTime ?? "",
      }))
    } catch (error) {
      this.handleGoogleApiError(error)
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
