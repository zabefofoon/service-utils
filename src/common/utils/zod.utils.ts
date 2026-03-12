import { BadRequestException } from "@nestjs/common"
import { z } from "zod"

export function throwZodBadRequest(error: unknown): never {
  if (error instanceof z.ZodError) {
    throw new BadRequestException(error.issues.map((issue) => issue.message).join(", "))
  }
  throw error
}
