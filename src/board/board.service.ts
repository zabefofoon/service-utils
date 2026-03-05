import { BadRequestException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common"
import { desc, eq } from "drizzle-orm"
import { CommonResponse } from "../common/models/CommonResponse"
import { PostgresService } from "../database/postgres.service"
import { Board, boards } from "../database/schema"
import { CreateBoardDto } from "./dto/create-board.dto"
import { UpdateBoardDto } from "./dto/update-board.dto"
@Injectable()
export class BoardService {
  constructor(private readonly postgresService: PostgresService) {}

  async create(createBoardDto: CreateBoardDto): Promise<CommonResponse<Board>> {
    if (!this.isValidText(createBoardDto.title)) {
      throw new BadRequestException("title is required")
    }

    if (!this.isValidText(createBoardDto.content)) {
      throw new BadRequestException("content is required")
    }

    const [createdBoard] = await this.postgresService
      .getDb()
      .insert(boards)
      .values({
        title: createBoardDto.title,
        content: createBoardDto.content,
      })
      .returning()

    return CommonResponse.of({
      data: createdBoard,
      statusCode: HttpStatus.OK,
    })
  }

  async findAll(): Promise<CommonResponse<Board[]>> {
    const boardList = await this.postgresService
      .getDb()
      .select()
      .from(boards)
      .orderBy(desc(boards.id))

    return CommonResponse.of({
      data: boardList,
      statusCode: HttpStatus.OK,
    })
  }

  async findOne(id: number): Promise<CommonResponse<Board>> {
    const [board] = await this.postgresService
      .getDb()
      .select()
      .from(boards)
      .where(eq(boards.id, id))
      .limit(1)

    if (!board) throw new NotFoundException(`Board ${id} not found`)

    return CommonResponse.of({
      data: board,
      statusCode: HttpStatus.OK,
    })
  }

  async update(id: number, updateBoardDto: UpdateBoardDto): Promise<CommonResponse<Board>> {
    const hasTitle = updateBoardDto.title !== undefined
    const hasContent = updateBoardDto.content !== undefined

    if (!hasTitle && !hasContent) {
      throw new BadRequestException("title or content is required")
    }

    if (hasTitle && !this.isValidText(updateBoardDto.title)) {
      throw new BadRequestException("title must be a non-empty string")
    }

    if (hasContent && !this.isValidText(updateBoardDto.content)) {
      throw new BadRequestException("content must be a non-empty string")
    }

    const [updatedBoard] = await this.postgresService
      .getDb()
      .update(boards)
      .set({
        ...(hasTitle ? { title: updateBoardDto.title } : {}),
        ...(hasContent ? { content: updateBoardDto.content } : {}),
        updatedAt: new Date(),
      })
      .where(eq(boards.id, id))
      .returning()

    if (!updatedBoard) throw new NotFoundException(`Board ${id} not found`)

    return CommonResponse.of({
      data: updatedBoard,
      statusCode: HttpStatus.OK,
    })
  }

  async remove(id: number): Promise<CommonResponse<number>> {
    const [deletedBoard] = await this.postgresService
      .getDb()
      .delete(boards)
      .where(eq(boards.id, id))
      .returning({ id: boards.id })

    if (!deletedBoard) throw new NotFoundException(`Board ${id} not found`)

    return CommonResponse.of({ data: id, statusCode: HttpStatus.OK })
  }

  private isValidText(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0
  }
}
