import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import dayjs from "dayjs"
import { CityService } from "../city/city.service"
import { PostgresService } from "../database/postgres.service"
import { HolidayService } from "../holiday/holiday.service"

@Injectable()
export class CronService {
  logger = new Logger("")

  constructor(
    private readonly holidayService: HolidayService,
    private readonly cityService: CityService,
    private readonly postgresService: PostgresService
  ) {}

  @Cron("4 0 1 * *")
  async handleEvery1DayMonth() {
    await this.postgresService.warmUp()
    this.holidayService.saveHolidayFromGoogle(dayjs().get("year")).catch(console.error)
  }

  @Cron("6 0 2 * *")
  async handleEvery2DayMonth() {
    await this.postgresService.warmUp()
    this.holidayService
      .saveHolidayFromGoogle(dayjs().add(1, "year").get("year"))
      .catch(console.error)
  }

  @Cron("8 0 3 */6 *")
  async handleEvery3Day6Month() {
    await this.postgresService.warmUp()
    this.holidayService.deleteHoliday(dayjs().subtract(1, "year").get("year")).catch(console.error)
  }

  @Cron("10 0 * * *")
  async handleEveryDays() {
    await this.postgresService.warmUp()
    this.cityService.updateCityWeatheres().catch(console.error)
    this.logger.log("called updateCityWeatheres")
  }

  @Cron("12 0 * * 0")
  async handleEveryWeek() {
    await this.postgresService.warmUp()
    this.cityService.removeUnusedCityWeather().catch(console.error)
  }
}
