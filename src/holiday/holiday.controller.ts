import { Controller, Get, Param } from "@nestjs/common"
import { HolidayService } from "./holiday.service"

@Controller("holiday")
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Get()
  async findAll() {
    return this.holidayService.findAll()
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.holidayService.findOne(id)
  }
}
