import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger"
import { BoardService } from "./board.service"
import { CreateBoardDto } from "./dto/create-board.dto"
import { UpdateBoardDto } from "./dto/update-board.dto"

@Controller("boards")
@ApiTags("Boards")
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  @ApiOperation({
    summary: "게시글 생성",
    description: "제목과 내용을 받아 새 게시글을 생성합니다.",
  })
  @ApiBody({ type: CreateBoardDto, description: "생성할 게시글 정보" })
  @ApiOkResponse({ description: "게시글 생성 성공" })
  @ApiBadRequestResponse({ description: "title 또는 content가 비어있는 경우" })
  async create(@Body() createBoardDto: CreateBoardDto) {
    return this.boardService.create(createBoardDto)
  }

  @Get()
  @ApiOperation({
    summary: "게시글 목록 조회",
    description: "최신순으로 게시글 전체 목록을 조회합니다.",
  })
  @ApiOkResponse({ description: "게시글 목록 조회 성공" })
  async findAll() {
    return this.boardService.findAll()
  }

  @Get(":id")
  @ApiOperation({
    summary: "게시글 단건 조회",
    description: "게시글 ID로 단건 데이터를 조회합니다.",
  })
  @ApiParam({ name: "id", type: Number, description: "조회할 게시글 ID", example: 1 })
  @ApiOkResponse({ description: "게시글 조회 성공" })
  @ApiNotFoundResponse({ description: "해당 ID의 게시글이 없는 경우" })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.boardService.findOne(id)
  }

  @Patch(":id")
  @ApiOperation({
    summary: "게시글 수정",
    description: "게시글 ID 기준으로 제목 또는 내용을 수정합니다.",
  })
  @ApiParam({ name: "id", type: Number, description: "수정할 게시글 ID", example: 1 })
  @ApiBody({ type: UpdateBoardDto, description: "수정할 게시글 정보 (title, content 중 1개 이상)" })
  @ApiOkResponse({ description: "게시글 수정 성공" })
  @ApiBadRequestResponse({ description: "수정할 필드가 없거나 값이 유효하지 않은 경우" })
  @ApiNotFoundResponse({ description: "해당 ID의 게시글이 없는 경우" })
  async update(@Param("id", ParseIntPipe) id: number, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardService.update(id, updateBoardDto)
  }

  @Delete(":id")
  @ApiOperation({
    summary: "게시글 삭제",
    description: "게시글 ID 기준으로 게시글을 삭제합니다.",
  })
  @ApiParam({ name: "id", type: Number, description: "삭제할 게시글 ID", example: 1 })
  @ApiOkResponse({ description: "게시글 삭제 성공" })
  @ApiNotFoundResponse({ description: "해당 ID의 게시글이 없는 경우" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.boardService.remove(id)
  }
}
