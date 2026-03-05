# service-utils

NestJS utility service.

## Setup

```bash
pnpm install
```

## PostgreSQL (Neon) connection

1. Create `.env` from `.env.example`.
2. Set `DATABASE_URL`.
3. Start the server.

```bash
pnpm run start:dev
```

Database health check endpoint:

```bash
GET /db/health
```

Expected response:

```json
{
  "status": "ok",
  "message": "PostgreSQL connection is healthy"
}
```
