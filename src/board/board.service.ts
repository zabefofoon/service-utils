import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { PostgresService } from '../database/postgres.service';
import { boards } from '../database/schema';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardService {
  constructor(private readonly postgresService: PostgresService) {}

  async create(createBoardDto: CreateBoardDto) {
    if (!this.isValidText(createBoardDto.title)) {
      throw new BadRequestException('title is required');
    }

    if (!this.isValidText(createBoardDto.content)) {
      throw new BadRequestException('content is required');
    }

    const [createdBoard] = await this.postgresService
      .getDb()
      .insert(boards)
      .values({
        title: createBoardDto.title,
        content: createBoardDto.content,
      })
      .returning();

    return createdBoard;
  }

  async findAll() {
    return this.postgresService
      .getDb()
      .select()
      .from(boards)
      .orderBy(desc(boards.id));
  }

  async findOne(id: number) {
    const [board] = await this.postgresService
      .getDb()
      .select()
      .from(boards)
      .where(eq(boards.id, id))
      .limit(1);

    if (!board) {
      throw new NotFoundException(`Board ${id} not found`);
    }

    return board;
  }

  async update(id: number, updateBoardDto: UpdateBoardDto) {
    const hasTitle = updateBoardDto.title !== undefined;
    const hasContent = updateBoardDto.content !== undefined;

    if (!hasTitle && !hasContent) {
      throw new BadRequestException('title or content is required');
    }

    if (hasTitle && !this.isValidText(updateBoardDto.title)) {
      throw new BadRequestException('title must be a non-empty string');
    }

    if (hasContent && !this.isValidText(updateBoardDto.content)) {
      throw new BadRequestException('content must be a non-empty string');
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
      .returning();

    if (!updatedBoard) {
      throw new NotFoundException(`Board ${id} not found`);
    }

    return updatedBoard;
  }

  async remove(id: number) {
    const [deletedBoard] = await this.postgresService
      .getDb()
      .delete(boards)
      .where(eq(boards.id, id))
      .returning({ id: boards.id });

    if (!deletedBoard) {
      throw new NotFoundException(`Board ${id} not found`);
    }

    return {
      status: 'ok',
      id: deletedBoard.id,
    };
  }

  private isValidText(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
