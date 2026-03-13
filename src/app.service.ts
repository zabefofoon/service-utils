import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common"
import { PgBoss } from "pg-boss"
import { CommonResponse } from "./common/models/CommonResponse"

const TEST_QUEUE_NAME = "test_queue"

interface TestQueuePayload {
  dataText: string
  enqueuedAt: string
}

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private boss: PgBoss | undefined
  private isBossReady = false
  private isWorkerEnabled = false

  async onModuleInit() {
    return // 테스트용으로 남겨두지만, 실제 사용은 안하므로 일단 꺼둠
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) return

    this.boss = new PgBoss({
      connectionString,
      ssl: { rejectUnauthorized: false },
    })
    await this.boss.start()
    const existingQueue = await this.boss.getQueue(TEST_QUEUE_NAME)

    if (!existingQueue) await this.boss.createQueue(TEST_QUEUE_NAME)

    await this.boss.work<TestQueuePayload>(TEST_QUEUE_NAME, async (jobs) => {
      for (const job of jobs) {
        await new Promise((resolve) => setTimeout(resolve, 1))
        console.log(`[pg-boss worker] processed job=${job.id}, dataText=${job.data.dataText}`)
      }
    })
    this.isWorkerEnabled = true

    this.isBossReady = true
  }

  async onModuleDestroy() {
    if (!this.boss) return

    if (this.isWorkerEnabled) {
      await this.boss.offWork(TEST_QUEUE_NAME).catch(() => undefined)
      this.isWorkerEnabled = false
    }

    await this.boss.stop()
    this.isBossReady = false
  }

  getHello(): CommonResponse<string> {
    return CommonResponse.of({
      data: "Hello, world!",
      statusCode: HttpStatus.OK,
    })
  }

  async testSomeEnqueue(
    dataText?: string
  ): Promise<CommonResponse<{ jobId: string | null; dataText: string; idempotencyKey: string }>> {
    const boss = this.getBossOrThrow()
    const payload: TestQueuePayload = {
      dataText: dataText?.trim() || `sample-${Date.now()}`,
      enqueuedAt: new Date().toISOString(),
    }
    const idempotencyKey = this.buildIdempotencyKey(payload.dataText)
    const jobId = await boss.send(TEST_QUEUE_NAME, payload, {
      // Suppress duplicate enqueue for the same key during this window.
      singletonKey: idempotencyKey,
      singletonSeconds: 300,
    })

    return CommonResponse.of({
      data: {
        jobId: jobId ? String(jobId) : null,
        dataText: payload.dataText,
        idempotencyKey,
      },
      message: jobId ? "queued" : "duplicate ignored by idempotency key",
      statusCode: HttpStatus.OK,
    })
  }

  async testSomeDequeue(): Promise<CommonResponse<{ jobId: string; dataText: string } | null>> {
    const boss = this.getBossOrThrow()
    const [job] = await boss.fetch<TestQueuePayload>(TEST_QUEUE_NAME)

    if (!job) {
      return CommonResponse.of({
        data: null,
        message: "queue is empty",
        statusCode: HttpStatus.OK,
      })
    }

    await boss.complete(TEST_QUEUE_NAME, job.id)

    return CommonResponse.of({
      data: { jobId: String(job.id), dataText: job.data.dataText },
      message: "dequeued",
      statusCode: HttpStatus.OK,
    })
  }

  private getBossOrThrow(): PgBoss {
    if (!this.boss || !this.isBossReady)
      throw new InternalServerErrorException(
        "pg-boss is not ready. DATABASE_URL and PostgreSQL connection are required."
      )

    return this.boss
  }

  private buildIdempotencyKey(dataText: string): string {
    return `test-queue:${dataText.trim().toLowerCase()}`
  }
}
