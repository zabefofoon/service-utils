import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger"
import dayjs from "dayjs"
import { HolidayService } from "./holiday.service"

@Controller("holiday")
@ApiTags("Holidays")
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Get()
  @ApiOperation({
    summary: "Google Calendar 공휴일 조회",
    description: "연도와 국가 코드 기준으로 Google Calendar 공휴일 데이터를 조회합니다.",
  })
  @ApiQuery({
    name: "year",
    type: Number,
    required: true,
    description: "조회할 연도 (1900~2100)",
    example: 2026,
  })
  @ApiQuery({
    name: "country",
    type: String,
    required: false,
    description: "국가 코드 (예: kr, us, jp)",
    example: "kr",
  })
  @ApiOkResponse({ description: "공휴일 목록 조회 성공" })
  @ApiBadRequestResponse({ description: "year가 누락되었거나 범위를 벗어난 경우" })
  async findAll(@Query("year", ParseIntPipe) year: number, @Query("country") country?: string) {
    return this.holidayService.findAll({ year, country })
  }

  @Get("/:country/:year")
  @ApiOperation({
    summary: "저장된 공휴일 조회",
    description: "DB에 저장된 특정 국가/연도의 공휴일 데이터를 조회합니다.",
  })
  @ApiParam({ name: "country", type: String, description: "국가 코드", example: "kr" })
  @ApiParam({ name: "year", type: Number, description: "조회할 연도", example: 2026 })
  @ApiOkResponse({ description: "저장된 공휴일 조회 성공" })
  async find(@Param("year", ParseIntPipe) year: number, @Param("country") country: string) {
    return this.holidayService.find(year, country)
  }

  @Get("/execute")
  @ApiOperation({
    summary: "공휴일 데이터 동기화 실행",
    description: "Google Calendar 공휴일 데이터를 조회해 DB에 저장(업서트)합니다.",
  })
  @ApiQuery({
    name: "year",
    type: Number,
    required: false,
    description: "동기화할 연도 (미입력 시 현재 연도)",
    example: 2026,
  })
  @ApiQuery({
    name: "country",
    type: String,
    required: false,
    description: "국가 코드 (미입력 시 지원 국가 전체 동기화)",
    example: "kr",
  })
  @ApiOkResponse({ description: "공휴일 동기화 성공" })
  @ApiBadRequestResponse({ description: "year가 범위를 벗어난 경우" })
  async execute(
    @Query("year", new DefaultValuePipe(dayjs().get("year")), ParseIntPipe) year: number,
    @Query("country") country?: string
  ) {
    return this.holidayService.saveHolidayFromGoogle(year, country)
  }
}
