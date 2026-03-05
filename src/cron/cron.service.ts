import { Injectable } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import dayjs from "dayjs"
import { HolidayService } from "../holiday/holiday.service"

@Injectable()
export class CronService {
  constructor(private readonly holidayService: HolidayService) {}
  @Cron("0 0 1 * *") // 매월 1일 00:00
  handleEveryMinute() {
    this.holidayService.saveHolidayFromGoogle(dayjs().get("year")).catch(console.error)
  }
}
