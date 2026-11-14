# Phase 4 Authentication Rate Limiting

## Limits

| Endpoint | Scope | Limit | Window |
| --- | --- | ---: | --- |
| `POST /api/auth/login` | Client IP | 30 requests | 15 minutes |
| `POST /api/auth/login` | Client IP + normalized username | 8 requests | 15 minutes |
| `POST /api/auth/register` | Client IP | 5 requests | 1 hour |

Rate-limit keys are SHA-256 hashes; raw IP addresses and usernames are not stored in the limiter table. PostgreSQL upserts perform the counter increment atomically, so counters are shared by Vercel serverless instances. Responses use HTTP 429 with `Retry-After` and `Cache-Control: no-store`. If PostgreSQL cannot enforce the limit, authentication mutations fail closed with HTTP 503.

Expired buckets are opportunistically pruned. The database index on `expiresAt` supports that cleanup.

## Database migration

This change adds `RateLimitBucket`. Apply the migration **before deploying the application code to Production**, otherwise login and registration will return HTTP 503 because the limiter deliberately fails closed.

Review the SQL file and apply it once using the managed PostgreSQL provider SQL editor (or an authenticated `psql` session) against the intended Production database:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/migrations/20261114000100_add_rate_limit_bucket/migration.sql
```

This repository previously used Prisma `db push` and has no baseline migration history. Do not assume `prisma migrate deploy` can safely reconcile the existing production schema without first establishing and reviewing a migration baseline. The supplied SQL only creates the `RateLimitBucket` table and its expiry index. It does not alter user, order, balance, transaction, or payment records.

Do not run `prisma db push --accept-data-loss` against Production.

## Verification

CI creates a disposable PostgreSQL service, runs `prisma db push` against that isolated database, and then runs the authentication and commerce API integration tests. They cover real database-backed login/registration, session creation, product listing, concurrent stock reservation, duplicate top-up references, one-time admin approval credits, and reward stock/points contention. Those tests create and remove test users/sessions and clear rate-limit buckets in the disposable CI database. They do not connect to Production.
