import { Controller, Get } from "@nestjs/common"
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { AppService } from "./app.service"
import { CommonResponse } from "./common/models/CommonResponse"

@Controller()
@ApiTags("App")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: "서비스 상태 메시지 조회",
    description: "서비스가 정상적으로 실행 중인지 확인하기 위한 기본 메시지를 반환합니다.",
  })
  @ApiOkResponse({ description: "서비스 상태 메시지 반환" })
  getHello(): CommonResponse<string> {
    return this.appService.getHello()
  }
}
