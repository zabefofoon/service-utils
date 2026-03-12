import { BadRequestException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common"
import { and, eq, sql } from "drizzle-orm"
import { CommonResponse } from "../common/models/CommonResponse"
import zodUtils from "../common/utils/zod.utils"
import { PostgresService } from "../database/postgres.service"
import { cities, cityWeather } from "../database/schema"
import { OpenMeteoClient, OpenMeteoWeatherResponse } from "../infra/open-meteo.client"
import {
  SCHEMA_CITY_WEATHER_PAYLOAD,
  SCHEMA_COORDINATE,
  SHEMA_WEATHER_QUERY,
} from "./city.validate"
import { NearestCity } from "./models/NearestCity"

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
  }): Promise<CommonResponse<OpenMeteoWeatherResponse> | undefined> {
    try {
      const parsed = SHEMA_WEATHER_QUERY.parse(params)

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
    } catch (error) {
      zodUtils.throwZodBadRequest(error)
    }
  }

  async findNearest(lat: number, lon: number): Promise<CommonResponse<NearestCity> | undefined> {
    try {
      const parsed = SCHEMA_COORDINATE.parse({ lat, lon })
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

      if (nearestByGeog)
        return CommonResponse.of({ data: nearestByGeog, statusCode: HttpStatus.OK })

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
    } catch (error) {
      zodUtils.throwZodBadRequest(error)
    }
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

    if (
      !cachedWeather ||
      !SCHEMA_CITY_WEATHER_PAYLOAD.safeParse(cachedWeather.weatherPayload).success
    )
      throw new NotFoundException(`No cached weather for geoname_id=${geonameId}`)

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

    if (
      cachedWeather &&
      SCHEMA_CITY_WEATHER_PAYLOAD.safeParse(cachedWeather.weatherPayload).success
    ) {
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
