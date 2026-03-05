import { HttpStatus } from "@nestjs/common"
import { STATUS_CODES } from "node:http"

export class CommonResponse<T> {
  data: T
  message?: string
  statusCode: HttpStatus
  error?: string

  constructor(commonResponse: Omit<CommonResponse<T>, "error">) {
    this.statusCode = commonResponse.statusCode
    this.data = commonResponse.data
    this.message = commonResponse.message
    this.error = STATUS_CODES[commonResponse.statusCode]
  }

  static of<T>(commonResponse: Omit<CommonResponse<T>, "error">) {
    return new CommonResponse(commonResponse)
  }
}
