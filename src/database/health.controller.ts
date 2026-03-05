import { Controller, Get } from "@nestjs/common"
import { PostgresService } from "./postgres.service"

@Controller("db")
export class HealthController {
  constructor(private readonly postgresService: PostgresService) {}

  @Get("health")
  async getDatabaseHealth() {
    return this.postgresService.checkConnection()
  }
}
