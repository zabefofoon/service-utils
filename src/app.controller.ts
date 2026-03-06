import { Controller, Get, Query } from "@nestjs/common"

import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger"
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

  @Get("/enqueue")
  @ApiOperation({
    summary: "큐 테스트(enqueue)",
    description: "pg-boss enqueue 테스트",
  })
  @ApiQuery({ name: "dataText", type: String, description: "데이터", required: false })
  @ApiOkResponse({ description: "enqueue 성공여부" })
  async testSomeEnqueue(@Query("dataText") dataText?: string): Promise<CommonResponse<unknown>> {
    return this.appService.testSomeEnqueue(dataText)
  }

  @Get("/dequeue")
  @ApiOperation({
    summary: "큐 테스트(dequeue)",
    description: "pg-boss dequeue 테스트",
  })
  @ApiOkResponse({ description: "dequeue 성공여부" })
  async testSomeDequeue(): Promise<CommonResponse<unknown>> {
    return this.appService.testSomeDequeue()
  }
}
