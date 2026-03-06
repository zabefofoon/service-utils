import { Controller, Get } from "@nestjs/common"
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from "@nestjs/swagger"
import { PostgresService } from "./postgres.service"

@Controller("db")
@ApiTags("Database")
export class HealthController {
  constructor(private readonly postgresService: PostgresService) {}

  @Get("health")
  @ApiOperation({
    summary: "DB 연결 상태 확인",
    description: "PostgreSQL 연결 가능 여부를 확인합니다.",
  })
  @ApiOkResponse({ description: "DB 연결 성공" })
  @ApiInternalServerErrorResponse({ description: "DATABASE_URL 미설정" })
  @ApiServiceUnavailableResponse({ description: "DB 연결 실패" })
  async getDatabaseHealth() {
    return this.postgresService.checkConnection()
  }
}
