import { Module } from "@nestjs/common"
import { DatabaseModule } from "../database/database.module"
import { CityController } from "./city.controller"
import { CityService } from "./city.service"

@Module({
  imports: [DatabaseModule],
  controllers: [CityController],
  providers: [CityService],
})
export class CityModule {}
