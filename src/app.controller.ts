import { Controller, Get } from "@nestjs/common"
import { AppService } from "./app.service"
import { CommonResponse } from "./common/models/CommonResponse"

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): CommonResponse<string> {
    return this.appService.getHello()
  }
}
