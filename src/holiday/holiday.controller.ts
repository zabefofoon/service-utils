import { Controller, Get, Query } from "@nestjs/common"
import { HolidayService } from "./holiday.service"

@Controller("holiday")
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Get()
  async findAll(@Query("year") year?: string, @Query("country") country?: string) {
    return this.holidayService.findAll({ year, country })
  }
}
