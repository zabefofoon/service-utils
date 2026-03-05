import { BadRequestException, HttpStatus, Injectable } from "@nestjs/common"
import { CommonResponse } from "../common/models/CommonResponse"
import { PostgresService } from "../database/postgres.service"

@Injectable()
export class HolidayService {
  constructor(private readonly postgresService: PostgresService) {}

  async findAll(): Promise<CommonResponse<string>> {
    await new Promise((resolve) => setTimeout(resolve, 0))
    return CommonResponse.of({
      data: "findAll",
      message: "success",
      statusCode: HttpStatus.OK,
    })
  }

  async findOne(id: string): Promise<CommonResponse<string>> {
    await new Promise((resolve) => setTimeout(resolve, 0))
    if (id === "2") throw new BadRequestException("fail test")
    return CommonResponse.of({
      data: id,
      message: "success",
      statusCode: HttpStatus.OK,
    })
  }

  getHolidayFromGoogle() {
    console.log(`[cron] HolidayService ${new Date().toISOString()} every-minute job`)
  }
}
