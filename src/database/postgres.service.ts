import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private readonly pool: Pool | null;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      this.pool = null;
      return;
    }

    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.pool) {
      return;
    }

    await this.pool.end();
  }

  async checkConnection(): Promise<{
    status: 'ok' | 'error';
    message: string;
  }> {
    if (!this.pool) {
      return {
        status: 'error',
        message: 'DATABASE_URL is not configured',
      };
    }

    try {
      await this.pool.query('SELECT 1');

      return {
        status: 'ok',
        message: 'PostgreSQL connection is healthy',
      };
    } catch (error) {
      return {
        status: 'error',
        message:
          error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }
}
