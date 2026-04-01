import { Module } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { CityModule } from "../city/city.module"
import { DatabaseModule } from "../database/database.module"
import { HolidayModule } from "../holiday/holiday.module"
import { CronService } from "./cron.service"

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule, HolidayModule, CityModule],
  providers: [CronService],
})
export class CronModule {}
