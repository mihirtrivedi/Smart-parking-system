# Smart Parking Lot Backend

A robust backend system for managing a multi-floor smart parking lot.

## Features
- **"Smallest fit first" allocation**: Intelligent fallback logic (e.g., Bikes use Small spots before burning Medium/Large ones).
- **Concurrency Safety**: Ensures atomic transactions and handles race conditions via Optimistic Concurrency Control (`version` column updates).
- **Grace Periods & Maps**: Implements a 15-minute grace period and Object-Oriented Strategy patterns for hourly rate mappings.
- **Robust Validation**: Uses Zod at the routing layer to ensure bad payloads never reach the service.
- **Centralized Logging**: Integrates Winston for structured JSON logging.

## Setup
```bash
npm install
npx prisma generate
npx prisma db push
npm start
```

## Switching to PostgreSQL
By default, the system uses SQLite for local development so it can run instantly without external dependencies. To switch to PostgreSQL:
1. Open `prisma/schema.prisma`.
2. Change `provider = "sqlite"` to `provider = "postgresql"`.
3. In your `.env` file, change the `DATABASE_URL` to a valid Postgres connection string (e.g., `postgresql://user:password@localhost:5432/parking`).
4. Run `npx prisma db push` to synchronize the schema.

## Out of Scope
- Daily fee caps and overnight pricing rates are currently not implemented (designed for standard hourly use cases).
- User authentication and RBAC.
