import { NestFactory } from "@nestjs/core"
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import "dotenv/config"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())

  const config = new DocumentBuilder()
    .setTitle("service-utils API")
    .setDescription("게시판, 공휴일, DB 상태 확인 기능을 제공하는 유틸리티 API")
    .setVersion("1.0.0")
    .addServer("/", "Current server")
    .addTag("App", "서비스 상태 확인 API")
    .addTag("Database", "데이터베이스 연결 상태 API")
    .addTag("Boards", "게시글 CRUD API")
    .addTag("Holidays", "공휴일 조회 및 동기화 API")
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api", app, documentFactory)

  await app.listen({
    port: Number(process.env.PORT ?? 3003),
    host: "0.0.0.0",
  })
}
void bootstrap()
