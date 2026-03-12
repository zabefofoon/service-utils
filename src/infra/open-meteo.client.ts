import { Injectable, ServiceUnavailableException } from "@nestjs/common"

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
  async fetchWeather(lat: number, lon: number): Promise<OpenMeteoWeatherResponse> {
    const query = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly: "temperature_2m,rain,snowfall,showers",
      current: "temperature_2m,rain,snowfall,showers,cloud_cover",
      past_hours: "24",
      forecast_hours: "24",
      timezone: "auto",
    })

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
      if (error instanceof ServiceUnavailableException) throw error
      throw new ServiceUnavailableException("Failed to fetch weather data")
    } finally {
      clearTimeout(timeout)
    }
  }
}
