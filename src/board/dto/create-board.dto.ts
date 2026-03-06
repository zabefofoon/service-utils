import { ApiProperty } from "@nestjs/swagger"

export class CreateBoardDto {
  @ApiProperty({
    description: "게시글 제목",
    example: "서비스 점검 안내",
  })
  title!: string

  @ApiProperty({
    description: "게시글 내용",
    example: "2026-03-10 02:00~03:00 동안 서비스 점검이 진행됩니다.",
  })
  content!: string
}
