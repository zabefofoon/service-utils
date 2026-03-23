import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common"
import etcUtil from "../common/utils/etc.util"

export interface OpenMeteoWeatherResponse {
  latitude: number
  longitude: number
  timezone: string
  current?: {
    time?: string
    temperature_2m?: number
    rain?: number
    snowfall?: number
    showers?: number
    cloud_cover?: number
  }
  hourly?: {
    time: string[]
    temperature_2m: number[]
    rain: number[]
    snowfall: number[]
    showers: number[]
  }
  current_units?: Record<string, string>
  hourly_units?: Record<string, string>
}

@Injectable()
export class OpenMeteoClient {
  private readonly logger = new Logger(OpenMeteoClient.name)

  async fetchWeather(lat: number, lon: number): Promise<OpenMeteoWeatherResponse> {
    const query = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly: "temperature_2m,rain,snowfall,showers,cloud_cover",
      past_hours: "24",
      forecast_hours: "24",
      timezone: "auto",
    })

    const maxRetries = 3
    const retryDelayMs = 3000

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new ServiceUnavailableException(`weather api failed: ${response.status}`)
        }

        return (await response.json()) as OpenMeteoWeatherResponse
      } catch (error) {
        const isLastAttempt = attempt === maxRetries

        if (isLastAttempt) {
          if (error instanceof ServiceUnavailableException) throw error
          throw new ServiceUnavailableException("Failed to fetch weather data")
        }

        this.logger.warn(
          `Failed to fetch weather data (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${retryDelayMs}ms...`
        )
        await etcUtil.sleep(retryDelayMs)
      } finally {
        clearTimeout(timeout)
      }
    }

    throw new ServiceUnavailableException("Failed to fetch weather data")
  }
}
