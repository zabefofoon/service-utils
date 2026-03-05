import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { sql } from "drizzle-orm"
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

@Injectable()
export class PostgresService implements OnModuleInit, OnModuleDestroy {
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
    })

    this.db = drizzle(this.pool, { schema })
  }

  async onModuleInit(): Promise<void> {
    if (!this.db) return

    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS board (
        id serial PRIMARY KEY,
        title text NOT NULL,
        content text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.pool) return

    await this.pool.end()
  }

  getDb(): NodePgDatabase<typeof schema> {
    if (!this.db) throw new Error("DATABASE_URL is not configured")

    return this.db
  }

  async checkConnection(): Promise<{
    status: "ok" | "error"
    message: string
  }> {
    if (!this.pool) {
      return {
        status: "error",
        message: "DATABASE_URL is not configured",
      }
    }

    try {
      await this.pool.query("SELECT 1")

      return {
        status: "ok",
        message: "PostgreSQL connection is healthy",
      }
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown database error",
      }
    }
  }
}
