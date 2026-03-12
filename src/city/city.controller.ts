import { Controller, Get, ParseFloatPipe, Query } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger"
import { CityService } from "./city.service"

@Controller("city")
@ApiTags("City")
export class CityController {
  constructor(private readonly cityService: CityService) {}

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
}
