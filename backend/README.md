# ERP Ledger API (NestJS + TypeScript + Sequelize/MySQL)

Backend for the ERP ledger schema (`schema.sql`), with JWT auth, RBAC (ADMIN / ACCOUNTANT),
and field-level encryption + tamper-evident hashing for sensitive financial records.

## Stack
- NestJS 10, TypeScript
- `@nestjs/sequelize` + `sequelize-typescript` (MySQL via `mysql2`)
- JWT auth (`passport-jwt`) + bcrypt password hashing
- AES-256-GCM field encryption, HMAC-SHA256 record signing, SHA-256 hash chaining (Node `crypto`, no external deps)

## Setup

```bash
npm install
cp .env.example .env       # fill in DB creds, JWT_SECRET, ENCRYPTION_KEY
mysql -u root -p < schema.sql
```

Generate a real 32-byte encryption key for `.env`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Bootstrap the first admin (auth/register requires an existing admin, so seed one directly):
```bash
npx ts-node -r dotenv/config src/scripts/seed-admin.ts admin@example.com "ChangeMe123!" "Super Admin"
```

Run:
```bash
npm run start:dev
```

## RBAC model
Two roles per `users.role`: `ADMIN`, `ACCOUNTANT`.
- `@Roles(Role.ADMIN, Role.ACCOUNTANT)` on a controller/route → both roles can call it.
- `@Roles(Role.ADMIN)` → admin-only (e.g. posting/voiding financial reports, day closing, user registration, key listing).
- Guards: `JwtAuthGuard` (verifies the bearer token) + `RolesGuard` (reads `@Roles()` metadata via `Reflector`). Both are applied per-controller in this scaffold; promote them to global guards in `main.ts` if you want auth-by-default everywhere.

## Encryption design (`CryptoService`, `src/modules/crypto`)
- **Field encryption (AES-256-GCM)**: free-text remarks (`sales_reports.remarks_*`, `expense_items.remarks_*`) are encrypted before insert and decrypted only when read back through the service layer (never exposed via raw Sequelize attributes in responses).
- **HMAC-SHA256 signing**: `hmac_signature` on `sales_reports` / `expense_reports` is computed over a canonical JSON of the record's financial fields. On read, the service recomputes the HMAC and returns `integrity_verified: true/false` — any direct DB tampering with amounts is detectable.
- **SHA-256 hash chaining**: `previous_hash` (sales/expense reports) and `daily_closing.hash` link each posted record to the prior one, like a lightweight blockchain — `DailyClosingService.verifyChain()` walks the whole `daily_closing` table and confirms no row was altered or removed.
- **Key management**: the raw AES key lives only in `ENCRYPTION_KEY` (env var / secrets manager), never in the DB. `encryption_keys` is bookkeeping only (key version history) for rotation auditing — see comments in `encryption-key.model.ts` if you want to extend to envelope encryption / KMS.

## Audit logging
Every mutating action (`CREATE`, `POST`, `VOID`, `REVERSE`, `LOGIN`, `DAY_CLOSE`, ...) is written to `audit_logs` via `AuditService`, capturing `user_id`, `old_value`/`new_value` JSON, and `ip_address` where available.

## Modules / endpoints
| Module | Base path | Notes |
|---|---|---|
| Auth | `/auth` | `POST /login` (public), `POST /register` (ADMIN only) |
| Ledger | `/ledger` | Append-only; corrections via `POST /:id/reverse` (ADMIN) |
| Cash | `/cash` | Cash in/out |
| Bank | `/bank` | Bank in/out |
| Sales | `/sales` | Encrypted remarks, HMAC + hash chain, `POST /:id/post` & `/:id/void` (ADMIN) |
| Expenses | `/expenses` | Report + line items, same crypto scheme |
| Debtors | `/debtors` | Customer ledger, `GET /balance/:customer_name` |
| Daily Closing | `/daily-closing` | `POST /` closes a day (ADMIN), `GET /verify` checks the hash chain |
| Encryption Keys | `/encryption-keys` | ADMIN-only key version listing |

All endpoints except `POST /auth/login` require `Authorization: Bearer <token>`.

## Notes / next steps
- `synchronize: false` is intentional — `schema.sql` is the source of truth for the DB; use a migration tool (e.g. `umzug` or `sequelize-cli`) for schema changes instead of model sync.
- Consider promoting `JwtAuthGuard`/`RolesGuard` to `APP_GUARD` providers in `AppModule` if you'd rather opt routes *out* of auth instead of into it.
- Rate limiting, refresh tokens, and password reset flows are not included — add `@nestjs/throttler` and a mail provider if needed.
