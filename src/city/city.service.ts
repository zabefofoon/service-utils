import { BadRequestException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common"
import { and, eq, sql } from "drizzle-orm"
import { CommonResponse } from "../common/models/CommonResponse"
import { PostgresService } from "../database/postgres.service"
import { cities, cityWeather } from "../database/schema"
import {
  OpenMeteoClient,
  OpenMeteoWeatherResponse,
} from "../weather/infrastructure/open-meteo.client"
import cityValidate from "./city.validate"

export interface NearestCity {
  geonameId: number
  name: string
  countryCode: string
  lat: number
  lon: number
  timezone: string | null
  distanceM: number
}

@Injectable()
export class CityService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly openMeteoClient: OpenMeteoClient
  ) {}

  async findWeather(params: {
    lat?: string
    lon?: string
    geonameId?: string
  }): Promise<CommonResponse<OpenMeteoWeatherResponse>> {
    const parsed = cityValidate.parseWeatherQuery(params)

    if (parsed.geonameId !== undefined) {
      return this.findWeatherFromCacheByGeonameId(parsed.geonameId)
    }

    const lat = parsed.lat
    const lon = parsed.lon
    if (lat === undefined || lon === undefined)
      throw new BadRequestException("lat/lon or geoname_id is required")

    const [city] = await this.postgresService
      .getDb()
      .select({
        geonameId: cities.geonameId,
        lat: cities.lat,
        lon: cities.lon,
      })
      .from(cities)
      .where(and(eq(cities.lat, lat), eq(cities.lon, lon)))
      .limit(1)

    if (!city) throw new NotFoundException("City not found for given lat/lon")

    return this.findOrFetchWeatherByCity(city.geonameId, city.lat, city.lon)
  }

  async findNearest(lat: number, lon: number): Promise<CommonResponse<NearestCity>> {
    const parsed = cityValidate.parseCoordinates({ lat, lon })
    const targetPoint = sql`ST_SetSRID(ST_MakePoint(${parsed.lon}, ${parsed.lat}), 4326)::geography`

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

    if (nearestByGeog) return CommonResponse.of({ data: nearestByGeog, statusCode: HttpStatus.OK })

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

    return CommonResponse.of({ data: nearestByLatLon, statusCode: HttpStatus.OK })
  }

  private async findWeatherFromCacheByGeonameId(
    geonameId: number
  ): Promise<CommonResponse<OpenMeteoWeatherResponse>> {
    const [cachedWeather] = await this.postgresService
      .getDb()
      .select({
        weatherPayload: cityWeather.weatherPayload,
      })
      .from(cityWeather)
      .where(eq(cityWeather.geonameId, geonameId))
      .limit(1)

    if (!cachedWeather || !cityValidate.hasUsableWeatherPayload(cachedWeather.weatherPayload)) {
      throw new NotFoundException(`No cached weather for geoname_id=${geonameId}`)
    }

    await this.postgresService
      .getDb()
      .update(cityWeather)
      .set({
        active: true,
        lastRequestedAt: new Date(),
      })
      .where(eq(cityWeather.geonameId, geonameId))

    return CommonResponse.of({
      data: cachedWeather.weatherPayload as OpenMeteoWeatherResponse,
      statusCode: HttpStatus.OK,
    })
  }

  private async findOrFetchWeatherByCity(
    geonameId: number,
    lat: number,
    lon: number
  ): Promise<CommonResponse<OpenMeteoWeatherResponse>> {
    const now = new Date()
    const [cachedWeather] = await this.postgresService
      .getDb()
      .select({
        weatherPayload: cityWeather.weatherPayload,
      })
      .from(cityWeather)
      .where(eq(cityWeather.geonameId, geonameId))
      .limit(1)

    if (cachedWeather && cityValidate.hasUsableWeatherPayload(cachedWeather.weatherPayload)) {
      await this.postgresService
        .getDb()
        .update(cityWeather)
        .set({
          active: true,
          lastRequestedAt: now,
        })
        .where(eq(cityWeather.geonameId, geonameId))

      return CommonResponse.of({
        data: cachedWeather.weatherPayload as OpenMeteoWeatherResponse,
        statusCode: HttpStatus.OK,
      })
    }

    const weatherData = await this.openMeteoClient.fetchWeather(lat, lon)

    await this.postgresService
      .getDb()
      .insert(cityWeather)
      .values({
        geonameId,
        weatherPayload: weatherData,
        active: true,
        lastRequestedAt: now,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [cityWeather.geonameId],
        set: {
          weatherPayload: weatherData,
          active: true,
          lastRequestedAt: now,
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          updatedAt: now,
        },
      })

    return CommonResponse.of({
      data: weatherData,
      statusCode: HttpStatus.OK,
    })
  }
}
