import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  OnModuleDestroy,
  ServiceUnavailableException,
} from "@nestjs/common"
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { CommonResponse } from "../common/models/CommonResponse"
import * as schema from "./schema"

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly pool: Pool | null
  private readonly db: NodePgDatabase<typeof schema> | null

  constructor() {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      this.pool = null
      this.db = null
      return
    }

    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10, // max_connections = 인스턴스 수 x 풀링갯수
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    })

    this.db = drizzle(this.pool, { schema })
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.pool) return

    await this.pool.end()
  }

  getDb(): NodePgDatabase<typeof schema> {
    if (!this.db) throw new Error("DATABASE_URL is not configured")

    return this.db
  }

  async checkConnection(): Promise<CommonResponse<boolean>> {
    if (!this.pool) throw new InternalServerErrorException("DATABASE_URL is not configured")

    try {
      await this.pool.query("SELECT 1")

      return CommonResponse.of({
        data: true,
        statusCode: HttpStatus.OK,
      })
    } catch {
      throw new ServiceUnavailableException("PostgreSQL connection failed")
    }
  }
}
