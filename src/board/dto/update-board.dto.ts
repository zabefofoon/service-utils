import { ApiPropertyOptional } from "@nestjs/swagger"

export class UpdateBoardDto {
  @ApiPropertyOptional({
    description: "수정할 게시글 제목",
    example: "서비스 점검 일정 변경 안내",
  })
  title?: string

  @ApiPropertyOptional({
    description: "수정할 게시글 내용",
    example: "점검 시간이 2026-03-10 03:00~04:00로 변경되었습니다.",
  })
  content?: string
}
