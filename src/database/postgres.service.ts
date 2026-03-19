import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  ServiceUnavailableException,
} from "@nestjs/common"
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { CommonResponse } from "../common/models/CommonResponse"
import * as schema from "./schema"

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name)
  private readonly pool: Pool | null
  private readonly db: NodePgDatabase<typeof schema> | null

  constructor() {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      this.pool = null
      this.db = null
      return
    }

    const max = Number(process.env.PG_POOL_MAX ?? 10)
    const idleTimeoutMillis = Number(process.env.PG_IDLE_TIMEOUT_MS ?? 30000)
    const connectionTimeoutMillis = Number(process.env.PG_CONNECTION_TIMEOUT_MS ?? 10000)

    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max,
      idleTimeoutMillis,
      connectionTimeoutMillis,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })
    this.pool.on("error", (error) => {
      this.logger.error(`PostgreSQL pool error: ${error.message}`, error.stack)
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
