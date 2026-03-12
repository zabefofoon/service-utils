import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common"
import { sql } from "drizzle-orm"
import { CommonResponse } from "../common/models/CommonResponse"
import { PostgresService } from "../database/postgres.service"
import { cities } from "../database/schema"

export interface NearestCity {
  geonameId: number
  name: string
  countryCode: string
  lat: number
  lon: number
  timezone: string | null
  distanceM: number
}

export interface CityWeather {
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
export class CityService {
  constructor(private readonly postgresService: PostgresService) {}

  async findWeather(
    lat: number,
    lon: number,
    geonameId?: number
  ): Promise<CommonResponse<CityWeather>> {
    this.validateCoordinate(lat, lon)

    if (geonameId) {
      // geonameId가 온다는건, db에 이미 있다는거라 생각해야함
      return CommonResponse.of({
        data: undefined as unknown as CityWeather,
        statusCode: HttpStatus.OK,
      })
    } else {
      const query = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        hourly: "temperature_2m,rain,snowfall,showers",
        current: "temperature_2m,rain,snowfall,showers,cloud_cover",
        past_hours: "24",
        forecast_hours: "24",
        timezone: "Asia/Seoul",
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

        const weatherData = (await response.json()) as CityWeather

        return CommonResponse.of({
          data: weatherData,
          statusCode: HttpStatus.OK,
        })
      } catch (error) {
        if (error instanceof ServiceUnavailableException) throw error
        throw new ServiceUnavailableException("Failed to fetch weather data")
      } finally {
        clearTimeout(timeout)
      }
    }
  }

  async findNearest(lat: number, lon: number): Promise<CommonResponse<NearestCity>> {
    this.validateCoordinate(lat, lon)

    const targetPoint = sql`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography`

    const [nearestByGeog] = await this.postgresService
      .getDb()
      .select({
        geonameId: cities.geonameId,
        name: cities.name,
        countryCode: cities.countryCode,
        lat: cities.lat,
        lon: cities.lon,
        timezone: cities.timezone,
        distanceM: sql<number>`ST_Distance(${cities.geog}, ${targetPoint})`,
      })
      .from(cities)
      .where(sql`${cities.geog} IS NOT NULL`)
      .orderBy(sql`${cities.geog} <-> ${targetPoint}`)
      .limit(1)

    if (nearestByGeog) {
      return CommonResponse.of({
        data: nearestByGeog,
        statusCode: HttpStatus.OK,
      })
    }

    const [nearestByLatLon] = await this.postgresService
      .getDb()
      .select({
        geonameId: cities.geonameId,
        name: cities.name,
        countryCode: cities.countryCode,
        lat: cities.lat,
        lon: cities.lon,
        timezone: cities.timezone,
        distanceM: sql<number>`ST_Distance(ST_SetSRID(ST_MakePoint(${cities.lon}, ${cities.lat}), 4326)::geography, ${targetPoint})`,
      })
      .from(cities)
      .orderBy(
        sql`ST_SetSRID(ST_MakePoint(${cities.lon}, ${cities.lat}), 4326)::geography <-> ${targetPoint}`
      )
      .limit(1)

    if (!nearestByLatLon) throw new NotFoundException("No city data found")

    return CommonResponse.of({
      data: nearestByLatLon,
      statusCode: HttpStatus.OK,
    })
  }

  private validateCoordinate(lat: number, lon: number): void {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException("lat/lon must be valid numbers")
    }

    if (lat < -90 || lat > 90) {
      throw new BadRequestException("lat must be between -90 and 90")
    }

    if (lon < -180 || lon > 180) {
      throw new BadRequestException("lon must be between -180 and 180")
    }
  }
}
