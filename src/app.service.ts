import { HttpStatus, Injectable } from "@nestjs/common"
import { CommonResponse } from "./common/models/CommonResponse"

@Injectable()
export class AppService {
  getHello(): CommonResponse<string> {
    return CommonResponse.of({
      data: "Hello, world!",
      statusCode: HttpStatus.OK,
    })
  }
}
