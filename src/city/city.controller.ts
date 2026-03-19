import { Controller, Get, ParseFloatPipe, Query } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiServiceUnavailableResponse,
  ApiTags,
} from "@nestjs/swagger"
import { CityService } from "./city.service"

@Controller("city")
@ApiTags("City")
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get("weather")
  @ApiOperation({
    summary: "좌표 기반 날씨 조회",
    description: "lat/lon 또는 geoname_id를 받아 날씨 데이터를 조회합니다.",
  })
  @ApiQuery({
    name: "lat",
    type: Number,
    required: false,
    description: "위도 (-90 ~ 90), geoname_id가 없을 때 필수",
    example: 37.5445,
  })
  @ApiQuery({
    name: "lon",
    type: Number,
    required: false,
    description: "경도 (-180 ~ 180), geoname_id가 없을 때 필수",
    example: 126.9837,
  })
  @ApiQuery({
    name: "geoname_id",
    type: Number,
    required: false,
    description: "있으면 city_weather DB 캐시를 geoname_id 기준으로 반환",
    example: 1835848,
  })
  @ApiOkResponse({ description: "날씨 조회 성공" })
  @ApiBadRequestResponse({
    description: "lat/lon 또는 geoname_id 파라미터가 유효하지 않은 경우",
  })
  @ApiNotFoundResponse({ description: "요청한 geoname_id의 날씨 캐시가 없는 경우" })
  @ApiServiceUnavailableResponse({ description: "외부 날씨 API 호출 실패" })
  findWeather(
    @Query("lat") lat?: string,
    @Query("lon") lon?: string,
    @Query("geoname_id") geonameId?: string
  ) {
    return this.cityService.findWeather({
      lat,
      lon,
      geonameId,
    })
  }

  @Get("nearest")
  @ApiOperation({
    summary: "좌표 기반 최근접 도시 조회",
    description: "위도/경도를 받아 city 테이블에서 가장 가까운 도시 1개를 반환합니다.",
  })
  @ApiQuery({
    name: "lat",
    type: Number,
    required: true,
    description: "위도 (-90 ~ 90)",
    example: 37.5665,
  })
  @ApiQuery({
    name: "lon",
    type: Number,
    required: true,
    description: "경도 (-180 ~ 180)",
    example: 126.978,
  })
  @ApiOkResponse({ description: "최근접 도시 조회 성공" })
  @ApiBadRequestResponse({ description: "lat/lon이 숫자가 아니거나 범위를 벗어난 경우" })
  @ApiNotFoundResponse({ description: "city 데이터가 없는 경우" })
  async findNearest(
    @Query("lat", ParseFloatPipe) lat: number,
    @Query("lon", ParseFloatPipe) lon: number
  ) {
    return this.cityService.findNearest(lat, lon)
  }

  @Get("weather/update")
  @ApiOperation({
    summary: "날씨 수동 업데이트",
    description: "날씨를 수동으로 업데이트 합니다.",
  })
  updateCityWeathers() {
    return this.cityService.updateCityWeatheres()
  }
}
