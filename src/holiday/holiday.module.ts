import { Module } from "@nestjs/common"
import { DatabaseModule } from "../database/database.module"
import { HolidayController } from "./holiday.controller"
import { HolidayService } from "./holiday.service"

@Module({
  imports: [DatabaseModule],
  controllers: [HolidayController],
  providers: [HolidayService],
  exports: [HolidayService],
})
export class HolidayModule {}
