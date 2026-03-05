import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PostgresService } from './postgres.service';

@Module({
  controllers: [HealthController],
  providers: [PostgresService],
  exports: [PostgresService],
})
export class DatabaseModule {}
