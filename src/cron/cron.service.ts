import { Injectable } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { HolidayService } from "../holiday/holiday.service"

@Injectable()
export class CronService {
  constructor(private readonly holidayService: HolidayService) {}
  @Cron(CronExpression.EVERY_MINUTE)
  handleEveryMinute() {
    this.holidayService.getHolidayFromGoogle()
  }
}
