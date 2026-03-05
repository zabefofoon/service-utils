import { Module } from "@nestjs/common"
import { ScheduleModule } from "@nestjs/schedule"
import { HolidayModule } from "../holiday/holiday.module"
import { CronService } from "./cron.service"

@Module({
  imports: [ScheduleModule.forRoot(), HolidayModule],
  providers: [CronService],
})
export class CronModule {}
