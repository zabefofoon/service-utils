import { HttpStatus } from "@nestjs/common"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { STATUS_CODES } from "node:http"

export class CommonResponse<T> {
  @ApiProperty({ description: "응답 데이터" })
  data: T

  @ApiPropertyOptional({ description: "응답 메시지", example: "success" })
  message?: string

  @ApiProperty({ description: "HTTP 상태 코드", example: 200 })
  statusCode: HttpStatus

  @ApiPropertyOptional({ description: "HTTP 상태 텍스트", example: "OK" })
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
