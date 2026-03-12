import { Injectable } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import dayjs from "dayjs"
import { CityService } from "../city/city.service"
import { HolidayService } from "../holiday/holiday.service"

@Injectable()
export class CronService {
  constructor(
    private readonly holidayService: HolidayService,
    private readonly cityService: CityService
  ) {}

  @Cron("0 0 1 * *")
  handleEvery1DayMonth() {
    this.holidayService.saveHolidayFromGoogle(dayjs().get("year")).catch(console.error)
  }

  @Cron("0 0 2 * *")
  handleEvery2DayMonth() {
    this.holidayService
      .saveHolidayFromGoogle(dayjs().add(1, "year").get("year"))
      .catch(console.error)
  }

  @Cron("0 0 3 */6 *")
  handleEvery3Day6Month() {
    this.holidayService.deleteHoliday(dayjs().subtract(1, "year").get("year")).catch(console.error)
  }

  @Cron("0 0 */2 * *")
  handleEvery2Days() {
    this.cityService.updateCityWeatheres().catch(console.error)
  }

  @Cron("0 0 * * 0")
  handleEveryWeek() {
    this.cityService.removeUnusedCityWeather().catch(console.error)
  }
}
