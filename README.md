# service-utils

NestJS utility service using Fastify + Drizzle ORM.

## Setup

```bash
pnpm install
```

## Environment

Create `.env` and set:

```env
DATABASE_URL="postgresql://neondb_owner:test@ep-shy-cell-a1woj4gv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
PORT=3001
```

## Run

```bash
pnpm run start:dev
```

## Endpoints

- `GET /db/health`
- `POST /boards`
- `GET /boards`
- `GET /boards/:id`
- `PATCH /boards/:id`
- `DELETE /boards/:id`
