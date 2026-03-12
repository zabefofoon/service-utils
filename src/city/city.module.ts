import { Module } from "@nestjs/common"
import { DatabaseModule } from "../database/database.module"
import { OpenMeteoClient } from "../weather/infrastructure/open-meteo.client"
import { CityController } from "./city.controller"
import { CityService } from "./city.service"

@Module({
  imports: [DatabaseModule],
  controllers: [CityController],
  providers: [CityService, OpenMeteoClient],
})
export class CityModule {}
