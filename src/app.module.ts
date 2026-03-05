import { Module } from "@nestjs/common"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { BoardModule } from "./board/board.module"
import { CronModule } from "./cron/cron.module"
import { DatabaseModule } from "./database/database.module"

@Module({
  imports: [DatabaseModule, BoardModule, CronModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
