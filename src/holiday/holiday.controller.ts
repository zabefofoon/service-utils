import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common"
import dayjs from "dayjs"
import { HolidayService } from "./holiday.service"

@Controller("holiday")
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Get()
  async findAll(@Query("year", ParseIntPipe) year: number, @Query("country") country?: string) {
    return this.holidayService.findAll({ year, country })
  }

  @Get("/:country/:year")
  async find(@Param("year", ParseIntPipe) year: number, @Param("country") country: string) {
    return this.holidayService.find(year, country)
  }

  @Get("/execute")
  async execute(
    @Query("year", ParseIntPipe) year: number = dayjs().get("year"),
    @Query("country") country?: string
  ) {
    return this.holidayService.saveHolidayFromGoogle(year, country)
  }
}
