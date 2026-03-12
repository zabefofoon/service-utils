import { Module } from "@nestjs/common"
import { DatabaseModule } from "../database/database.module"
import { GoogleCalendarClient } from "../infra/google-calendar.client"
import { HolidayController } from "./holiday.controller"
import { HolidayService } from "./holiday.service"

@Module({
  imports: [DatabaseModule],
  controllers: [HolidayController],
  providers: [HolidayService, GoogleCalendarClient],
  exports: [HolidayService],
})
export class HolidayModule {}
