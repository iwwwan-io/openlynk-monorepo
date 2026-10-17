# Openlynk Monorepo: Master Evidence Log & Traceability Index

**Project:** Openlynk Monorepo (`openlynk`)  
**Live Production URL:** `https://openlynkidmono.vercel.app/`  
**Audit Authority:** Multi-Agent Parallel Engineering Audit Team  
**Scope:** Source File Inventory, Subagent Artifact Mapping, Live Network Telemetry, Environment Redaction Log, and Finding Traceability Matrix  
**Integrity Mode:** Strict Read-Only Verification, Zero Secrets Leakage

---

## 1. Complete Source Code Inventory

An exhaustive inspection was performed across all packages, applications, and configurations in the Openlynk monorepo:

### 1.1. `@openlynk/db` (`packages/db`)

| File Path                                             | Lines | Purpose & Architectural Role                                                                                             | Inspected By     |
| ----------------------------------------------------- | :---: | ------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| `packages/db/schema.ts`                               |  145  | Core PostgreSQL Drizzle ORM schema: `user`, `session`, `account`, `verification`, `profile`, `link`, `product`, `order`. | WS-B, WS-C, WS-D |
| `packages/db/src/index.ts`                            |  49   | Database client factory using `postgres-js` with `prepare: false`, `max: 5`, and Drizzle operator re-exports.            | WS-A, WS-C       |
| `packages/db/src/schema.test.ts`                      |  65   | Automated tests validating schema definitions, column exports, and client connection options.                            | WS-F             |
| `packages/db/drizzle.config.ts`                       |  15   | Drizzle Kit CLI configuration reading `DATABASE_URL_DIRECT` for DDL migrations.                                          | WS-A, WS-C       |
| `packages/db/package.json`                            |  27   | Package manifest specifying exports (`.`, `./schema`), dependencies (`drizzle-orm`, `postgres`).                         | WS-A             |
| `packages/db/drizzle/0000_fantastic_betty_ross.sql`   |  55   | Initial DDL migration for Better Auth tables (`user`, `session`, `account`, `verification`).                             | WS-C             |
| `packages/db/drizzle/0001_amusing_the_hand.sql`       |  16   | DDL migration creating creator `profile` table with unique constraints.                                                  | WS-C             |
| `packages/db/drizzle/0002_aspiring_scrambler.sql`     |  27   | DDL migration creating `link` and `product` tables with foreign keys.                                                    | WS-C             |
| `packages/db/drizzle/0003_naive_christian_walker.sql` |  26   | DDL migration creating `order` table with `onDelete: restrict` on products.                                              | WS-C, WS-D       |

### 1.2. `@openlynk/auth` (`packages/auth`)

| File Path                        | Lines | Purpose & Architectural Role                                                                | Inspected By |
| -------------------------------- | :---: | ------------------------------------------------------------------------------------------- | ------------ |
| `packages/auth/src/index.ts`     |  44   | Server-side Better Auth initialization with Drizzle adapter and Google OAuth configuration. | WS-A, WS-B   |
| `packages/auth/src/client.ts`    |  15   | Client-side Better Auth client (`authClient`, `signIn`, `signUp`, `signOut`).               | WS-A, WS-B   |
| `packages/auth/src/auth.test.ts` |  42   | Vitest suite validating authentication methods and OAuth environment detection.             | WS-F         |
| `packages/auth/package.json`     |  26   | Package manifest exporting server (`.`) and client (`./client`) entry points.               | WS-A         |

### 1.3. `@openlynk/ui` (`packages/ui`)

| File Path                               | Lines | Purpose & Architectural Role                                                                 | Inspected By |
| --------------------------------------- | :---: | -------------------------------------------------------------------------------------------- | ------------ |
| `packages/ui/src/index.ts`              |   8   | Main barrel export for UI primitives and the `cn` utility.                                   | WS-A         |
| `packages/ui/src/lib/utils.ts`          |   7   | ClassName merger using `clsx` and `tailwind-merge`.                                          | WS-A, WS-E   |
| `packages/ui/src/components/button.tsx` |  55   | Radix UI Slot-based button component supporting `asChild` and design variants.               | WS-E         |
| `packages/ui/src/components/card.tsx`   |  80   | Card primitives (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`). | WS-E         |
| `packages/ui/src/components/input.tsx`  |  25   | Accessible input wrapper with focus ring styles.                                             | WS-E         |
| `packages/ui/src/components/label.tsx`  |  26   | Accessible form label component built on `@radix-ui/react-label`.                            | WS-E         |
| `packages/ui/src/components/badge.tsx`  |  37   | Badge component with semantic variants.                                                      | WS-E         |
| `packages/ui/src/components.test.ts`    |  45   | Vitest suite asserting primitive component exports and className merging.                    | WS-F         |
| `packages/ui/package.json`              |  26   | Package manifest with `"build": "exit 0"` for Next.js source transpilation.                  | WS-A         |

### 1.4. `@openlynk/config` & Tooling

| File Path                            | Lines | Purpose & Architectural Role                                                               | Inspected By     |
| ------------------------------------ | :---: | ------------------------------------------------------------------------------------------ | ---------------- |
| `packages/config/tsconfig.base.json` |  28   | Base TypeScript configuration (`strict: true`, `noImplicitAny: true`, bundler resolution). | WS-A             |
| `packages/config/package.json`       |  12   | Tooling package manifest (identified phantom `"main": "index.js"`).                        | WS-A             |
| `turbo.json`                         |  67   | Monorepo pipeline DAG, task definitions, inputs/outputs, and global environment array.     | WS-A, WS-C, WS-G |
| `pnpm-workspace.yaml`                |   7   | Workspace declaration for `apps/*`, `packages/*`, and `docs`.                              | WS-A             |
| `eslint.config.mjs`                  |  28   | Root ESLint v9 Flat Config with strict TypeScript zero `any` rule.                         | WS-A, WS-F       |
| `vitest.config.ts`                   |  17   | Root Vitest configuration with path aliases for all workspace packages.                    | WS-A, WS-F       |
| `.prettierignore`                    |  10   | Prettier ignore configuration (root cause of `pnpm format` failure).                       | WS-A, WS-F       |

### 1.5. `apps/web` (Next.js Application)

| File Path                                                         | Lines | Purpose & Architectural Role                                                                                 | Inspected By     |
| ----------------------------------------------------------------- | :---: | ------------------------------------------------------------------------------------------------------------ | ---------------- |
| `apps/web/next.config.mjs`                                        |   9   | Next.js configuration (transpilePackages, serverExternalPackages).                                           | WS-A, WS-G       |
| `apps/web/tailwind.config.ts`                                     |  81   | Tailwind CSS configuration purging `app/` and `../../packages/ui/src`.                                       | WS-A, WS-E       |
| `apps/web/app/layout.tsx`                                         |  24   | Root Server Component layout injecting Inter font and metadata defaults.                                     | WS-A, WS-E       |
| `apps/web/app/(marketing)/page.tsx`                               |  45   | Public landing page with hero CTAs to `/register` and `/login`.                                              | WS-E             |
| `apps/web/app/(auth)/layout.tsx`                                  |  24   | Guest session guard layout redirecting authenticated users to `/dashboard`.                                  | WS-A, WS-B       |
| `apps/web/app/(auth)/login/login-form.tsx`                        |  196  | Client component for creator login supporting email/password and Google OAuth.                               | WS-B, WS-E       |
| `apps/web/app/(auth)/register/register-form.tsx`                  |  215  | Client component for creator registration.                                                                   | WS-B, WS-E       |
| `apps/web/app/(dashboard)/layout.tsx`                             |  55   | Authenticated session guard layout validating user session and active profile.                               | WS-A, WS-B       |
| `apps/web/app/(dashboard)/dashboard/page.tsx`                     |  165  | Creator dashboard metrics overview, public profile preview, and navigation cards.                            | WS-E             |
| `apps/web/app/(dashboard)/dashboard/link-manager.tsx`             |  325  | Client component for bio link CRUD, position reordering, and visibility toggling.                            | WS-C, WS-E       |
| `apps/web/app/(dashboard)/dashboard/products/product-manager.tsx` |  425  | Client component for digital product CRUD, IDR pricing, and delivery URL entry.                              | WS-C, WS-D, WS-E |
| `apps/web/app/[username]/page.tsx`                                |  245  | Dynamic public creator profile rendering links, products, and strictly omitting `delivery_url`.              | WS-A, WS-B, WS-E |
| `apps/web/app/checkout/[productId]/page.tsx`                      |  75   | Server-authoritative checkout page verifying active product and genuine price from DB.                       | WS-B, WS-D       |
| `apps/web/app/checkout/[productId]/checkout-form.tsx`             |  255  | Client component triggering Midtrans Snap payment modal and redirecting to order portal.                     | WS-D, WS-E       |
| `apps/web/app/order/[accessToken]/page.tsx`                       |  305  | Order fulfillment page querying `delivery_url` strictly when `status === 'paid'`.                            | WS-B, WS-D, WS-E |
| `apps/web/app/order/[accessToken]/order-status-refresh.tsx`       |  32   | Client refresh button for polling order status.                                                              | WS-E             |
| `apps/web/app/actions/auth.ts`                                    |  125  | Server Actions: `registerAction` and `loginAction`.                                                          | WS-B             |
| `apps/web/app/actions/profile.ts`                                 |  165  | Server Actions: `createProfileOnboardingAction` and `updateProfileAction`.                                   | WS-B, WS-C       |
| `apps/web/app/actions/link.ts`                                    |  365  | Server Actions: `createLinkAction`, `updateLinkAction`, `deleteLinkAction`, `reorderLinkAction`.             | WS-C             |
| `apps/web/app/actions/product.ts`                                 |  445  | Server Actions: `createProductAction`, `updateProductAction`, `deleteProductAction`, `reorderProductAction`. | WS-C, WS-D       |
| `apps/web/app/actions/order.ts`                                   |  185  | Server Action: `createOrderAction` with server-authoritative price lookup and Snap API call.                 | WS-B, WS-D       |
| `apps/web/app/api/auth/[...all]/route.ts`                         |  10   | Route Handler delegating authentication requests to Better Auth handler.                                     | WS-A, WS-B       |
| `apps/web/app/api/webhooks/midtrans/route.ts`                     |  115  | Route Handler for Midtrans webhooks with timing-safe SHA-512 signature verification.                         | WS-B, WS-C, WS-D |
| `apps/web/lib/midtrans.ts`                                        |  275  | Midtrans SDK wrapper, timing-safe crypto, gross_amount parsing, and status mapping.                          | WS-B, WS-D       |
| `apps/web/lib/product-validation.ts`                              |  185  | Pure validators for product titles, integer IDR price bounds, and delivery URL whitelist.                    | WS-B, WS-D       |
| `apps/web/lib/profile-validation.ts`                              |  230  | Pure validators for usernames, 52 reserved system keywords, avatars, and link URLs.                          | WS-B, WS-E       |
| `apps/web/app/sitemap.ts`                                         |  35   | Dynamic sitemap generator fetching all creator profiles from database.                                       | WS-G             |
| `apps/web/app/robots.ts`                                          |  22   | Robots crawler directives disallowing `/dashboard`, `/checkout`, `/order`.                                   | WS-G             |

---

## 2. Subagent Working Directory & Artifact Mapping

The audit was executed by seven specialized subagents coordinated by the Lead Orchestrator:

| Workstream                    | Subagent Role         | Conversation / Agent ID                | Working Directory                    | Primary Report Deliverable                      |
| ----------------------------- | --------------------- | -------------------------------------- | ------------------------------------ | ----------------------------------------------- |
| **Orchestrator**              | Lead Orchestrator     | `d83d3f42-100e-4266-a840-753fd912fb5a` | `.agents/teamwork/orchestrator_1/`   | `plan.md`, `progress.md`                        |
| **WS-A: Architecture**        | Architecture Lead     | `explorer_ws_a`                        | `.agents/teamwork/explorer_ws_a/`    | `.agents/teamwork/explorer_ws_a/report_ws_a.md` |
| **WS-B: Security & Auth**     | Security Engineer     | `auditor_ws_b`                         | `.agents/teamwork/auditor_ws_b/`     | `.agents/teamwork/auditor_ws_b/report_ws_b.md`  |
| **WS-C: Database Integrity**  | Database Architect    | `explorer_ws_c`                        | `.agents/teamwork/explorer_ws_c/`    | `.agents/teamwork/explorer_ws_c/report_ws_c.md` |
| **WS-D: Payments & Midtrans** | Payments Specialist   | `auditor_ws_d`                         | `.agents/teamwork/auditor_ws_d/`     | `.agents/teamwork/auditor_ws_d/report_ws_d.md`  |
| **WS-E: Frontend & UX**       | Frontend & UX Lead    | `explorer_ws_e`                        | `.agents/teamwork/explorer_ws_e/`    | `.agents/teamwork/explorer_ws_e/report_ws_e.md` |
| **WS-F: QA & Quality Gates**  | QA & Reliability Lead | `worker_ws_f`                          | `.agents/teamwork/worker_ws_f/`      | `.agents/teamwork/worker_ws_f/report_ws_f.md`   |
| **WS-G: DevOps & Production** | DevOps / SRE Lead     | `explorer_ws_g`                        | `.agents/teamwork/explorer_ws_g/`    | `.agents/teamwork/explorer_ws_g/report_ws_g.md` |
| **Synthesis & Writing**       | Master Synthesis Lead | `worker_synthesis`                     | `.agents/teamwork/worker_synthesis/` | Master Deliverables (Root)                      |

---

## 3. Network & Production Inspection Evidence

Passive network inspections of `https://openlynkidmono.vercel.app/` were conducted on October 16, 2026:

### 3.1. Live HTTP Response Headers: Public Marketing (`GET /`)

```http
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 35586
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline
Content-Length: 11404
Content-Type: text/html; charset=utf-8
Date: Fri, 16 Oct 2026 02:04:26 GMT
Etag: "b3f4d5fc9d41698459fdf98ccc8fc299"
Server: Vercel
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
X-Matched-Path: /
X-Nextjs-Prerender: 1
X-Nextjs-Stale-Time: 300
X-Vercel-Cache: HIT
X-Vercel-Id: sin1::b7zjh-1792116266351-ab491a89661d
```

- **Observations**: Handled directly by Vercel Edge Cache in Singapore (`sin1`) as a prerendered static document (`X-Nextjs-Prerender: 1`, `X-Vercel-Cache: HIT`).

### 3.2. Live HTTP Response Headers: Dynamic Authentication (`GET /login`)

```http
HTTP/1.1 200 OK
Age: 0
Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
Content-Type: text/html; charset=utf-8
Date: Fri, 16 Oct 2026 02:05:13 GMT
Server: Vercel
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
X-Matched-Path: /login
X-Powered-By: Next.js
X-Vercel-Cache: MISS
X-Vercel-Id: sin1::iad1::7kkjg-1792116312799-a45a102bfaee
```

- **Observations**:
  1. `X-Vercel-Id: sin1::iad1::...` proves serverless function execution is delegated to Washington D.C., USA (`iad1`).
  2. `X-Powered-By: Next.js` is active and exposed.
  3. `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy` are absent.

### 3.3. SSL/TLS Certificate Parameters

- **Common Name**: `openlynkidmono.vercel.app`
- **Issuer**: Let's Encrypt / Google Trust Services (Vercel Managed PKI)
- **Protocol**: TLSv1.3 (Cipher: `TLS_AES_128_GCM_SHA256`)
- **Key Exchange**: X25519 (253 bits)
- **Validation**: Strict TLS certificate handshake verified with 0 certificate chain errors.

---

## 4. Environment Variable Inventory & Redaction Log

In accordance with strict security rules, all secret values have been confirmed absent from git-tracked code and redacted from audit deliverables:

| Variable Identifier      | Scope / Consumer                | Target Environment    | Sensitivity Level | Status in Codebase & Redaction State                                |
| ------------------------ | ------------------------------- | --------------------- | :---------------: | ------------------------------------------------------------------- |
| `DATABASE_URL`           | `@openlynk/db` (runtime pooler) | Production / Dev      |   **CRITICAL**    | Read exclusively via `process.env`. Value redacted as `[REDACTED]`. |
| `DATABASE_URL_DIRECT`    | `packages/db/drizzle.config.ts` | Direct Session (5432) |   **CRITICAL**    | Read exclusively via `process.env`. Value redacted as `[REDACTED]`. |
| `BETTER_AUTH_SECRET`     | `@openlynk/auth` (Better Auth)  | Serverless Runtime    |   **CRITICAL**    | Read exclusively via `process.env`. Value redacted as `[REDACTED]`. |
| `BETTER_AUTH_URL`        | `@openlynk/auth`, `apps/web`    | Public Origin         |     Standard      | Set to `https://openlynkidmono.vercel.app`. Non-secret.             |
| `NEXT_PUBLIC_APP_URL`    | `apps/web` (metadata & client)  | Public Origin         |     Standard      | Set to `https://openlynkidmono.vercel.app`. Non-secret.             |
| `GOOGLE_CLIENT_ID`       | `@openlynk/auth` (OAuth)        | Client / Server       |     Standard      | Public OAuth Client ID.                                             |
| `GOOGLE_CLIENT_SECRET`   | `@openlynk/auth` (OAuth)        | Serverless Runtime    |     **HIGH**      | Read exclusively via `process.env`. Value redacted as `[REDACTED]`. |
| `MIDTRANS_SERVER_KEY`    | `apps/web/lib/midtrans.ts`      | Payment Server API    |   **CRITICAL**    | Read exclusively via `process.env`. Value redacted as `[REDACTED]`. |
| `MIDTRANS_CLIENT_KEY`    | `apps/web/app/checkout/...`     | Browser Snap Script   |   Public Client   | Public Client Key for Midtrans Snap frontend.                       |
| `MIDTRANS_IS_PRODUCTION` | `apps/web/lib/midtrans.ts`      | Gateway Environment   |     Standard      | Boolean (`"true"` or `"false"`).                                    |
| `NODE_ENV`               | `next-runner.mjs`, App Runtime  | Node.js Environment   |     Standard      | `"development"` / `"production"` / `"test"`.                        |

---

## 5. Master Finding Traceability Matrix

This matrix links every Finding ID to its exact source line, workstream report, and quality gate impact:

| Finding ID       | Primary Source Location                                         | Workstream Report |      Quality Gate Impact       | Remediation Reference                           |
| ---------------- | --------------------------------------------------------------- | ----------------- | :----------------------------: | ----------------------------------------------- |
| **SEC-01**       | `apps/web/app/api/webhooks/midtrans/route.ts:46-54, 78-83, 107` | WS-B, WS-C, WS-D  |      Test Concurrency Gap      | Atomic SQL `WHERE status != 'paid'`             |
| **SEC-08**       | `apps/web/.env.local:7, 11`                                     | WS-B, WS-G        |       Runtime Isolation        | Point local `DATABASE_URL` to `openlynk_dev`    |
| **ARCH-01**      | `turbo.json:4-14`, `packages/db/drizzle.config.ts:6-8`          | WS-A, WS-C, WS-G  |      Turbo Cache Hashing       | Add `DATABASE_URL_DIRECT` to `globalEnv`        |
| **ARCH-02**      | `.prettierignore:1-10`, `package.json:13`                       | WS-A, WS-F        |     `pnpm format` (Exit 1)     | Add `.agents/` and `next-env.d.ts` to ignore    |
| **ARCH-03**      | `packages/config/package.json:5-8`                              | WS-A              |     Node Module Resolution     | Remove phantom `"main": "index.js"`             |
| **ARCH-04**      | `apps/web/app/` (all route directories)                         | WS-A, WS-E        |    Next.js Build Prerender     | Add `loading.tsx`, `error.tsx`, `not-found.tsx` |
| **ARCH-05**      | `turbo.json:1-67`                                               | WS-A              |    Turbo Cache Invalidation    | Add `globalDependencies` array                  |
| **ARCH-06**      | `turbo.json:48-53`                                              | WS-A              |      Pipeline Concurrency      | Remove `^` from `typecheck` and `lint`          |
| **ARCH-07**      | `packages/db/src/index.ts:1`, `packages/auth/src/index.ts:1`    | WS-A, WS-B        |   Bundler Client Poison Pill   | Add `import "server-only";`                     |
| **ARCH-08**      | `pnpm-workspace.yaml:4`, `docs/package.json:1-12`               | WS-A              |   Workspace Task Scheduling    | Retain workspace or remove `docs`               |
| **ARCH-09**      | Monorepo Root (no `.github/workflows/`)                         | WS-A, WS-G, WS-F  |   PR Verification Automation   | Add `.github/workflows/ci.yml`                  |
| **ARCH-10**      | Monorepo Root                                                   | WS-A              |      IDE Language Server       | Add root composite `tsconfig.json`              |
| **ARCH-11**      | `apps/web/next.config.mjs:1-9`                                  | WS-A, WS-B, WS-G  |     HTTP Header Inspection     | Add `headers()` to `next.config.mjs`            |
| **ARCH-12**      | `apps/web/app/[username]/page.tsx:33-42, 89-94`                 | WS-A, WS-B        |   Server Query Deduplication   | Wrap profile fetch in React `cache()`           |
| **SEC-02**       | `apps/web/app/order/[accessToken]/page.tsx:64-85`               | WS-B, WS-D        |         Data Integrity         | Require `remote.grossAmount !== null`           |
| **SEC-03**       | `apps/web/next.config.mjs:1-9`, Live Edge Headers               | WS-B, WS-G        |   Security Header Inspection   | Add `X-Frame-Options` and `nosniff`             |
| **SEC-04**       | `apps/web/app/actions/auth.ts`, `actions/order.ts`              | WS-B, WS-D        |     Rate Limiting Defense      | Deploy Upstash Redis rate limiting              |
| **SEC-05**       | `packages/db/schema.ts:24-53`                                   | WS-B, WS-C        |     Sequential Table Scan      | Add indexes on `session/account.user_id`        |
| **SEC-06**       | `apps/web/app/actions/auth.ts:46-61`, `link.ts:40-56`           | WS-B              |        Error Disclosure        | Sanitize production error toast strings         |
| **SEC-07**       | `apps/web/app/[username]/page.tsx:33-42, 89-94`                 | WS-B              |      Query Deduplication       | Deduplicate profile query via React `cache()`   |
| **SEC-09**       | `apps/web/app/actions/link.ts:163, 206`, `product.ts:216`       | WS-B              |     Access Control Defense     | Include `profileId` in SQL update/delete        |
| **DB-01**        | `apps/web/app/api/webhooks/midtrans/route.ts:46-51, 107`        | WS-C, WS-D        |   Concurrency Race Condition   | Atomic SQL update predicate                     |
| **DB-02**        | `apps/web/app/order/[accessToken]/page.tsx:64-85`               | WS-C, WS-D        | Order Status Polling Overwrite | Add `ne(order.status, 'paid')` predicate        |
| **DB-03**        | `apps/web/app/actions/link.ts:329-362`, `product.ts:406`        | WS-C              |       Atomic Transaction       | Wrap reorder queries in `db.transaction()`      |
| **DB-04**        | `apps/web/app/actions/link.ts:85-100`, `product.ts:121`         | WS-C              |    Position Collision Race     | Use atomic SQL `MAX(position) + 1`              |
| **DB-05**        | `apps/web/app/actions/order.ts:69-81, 124-177`                  | WS-C, WS-D        |          Data Hygiene          | Update status to `'failed'` in catch block      |
| **DB-06**        | `packages/db/schema.ts:37-53`                                   | WS-C, WS-B        |        Data Uniqueness         | Add composite unique index on account           |
| **DB-07**        | `packages/db/schema.ts:24-53`                                   | WS-C              |       Query Performance        | Add foreign key secondary indexes               |
| **DB-08**        | `packages/db/schema.ts` (all tables)                            | WS-C              |       Temporal Precision       | Migrate to `timestamp with time zone`           |
| **DB-09**        | `packages/db/schema.ts:110, 132, 133`                           | WS-C, WS-D        |      DB-Level Constraints      | Add CHECK constraints & pgEnum                  |
| **DB-10**        | `packages/db/schema.ts:67, 85, 104, 125`                        | WS-C              |       Database Defaults        | Add `.default(sqlgen_random_uuid())`            |
| **DB-12**        | `packages/db/schema.ts:120-144`                                 | WS-C              |       Composite Indexing       | Add index on `order(product_id, status)`        |
| **PAY-01**       | `apps/web/app/api/webhooks/midtrans/route.ts:46-51, 107`        | WS-D              |   Concurrency Race Condition   | Atomic SQL update predicate                     |
| **PAY-02**       | `apps/web/app/order/[accessToken]/page.tsx:64-85`               | WS-D              |    Status Polling Overwrite    | Add `ne(order.status, 'paid')`                  |
| **PAY-03**       | `apps/web/app/order/[accessToken]/page.tsx:67-69`               | WS-D              |      Amount Verification       | Require non-null gross amount match             |
| **PAY-04**       | `apps/web/app/actions/order.ts:69-81, 124-177`                  | WS-D              |          Data Hygiene          | Mark failed on Snap network exception           |
| **PAY-05**       | `packages/db/schema.ts:121-144`                                 | WS-D              |       Monetization Model       | Add platform fee & creator earnings cols        |
| **PAY-06**       | `packages/db/schema.ts:121-144`, `page.tsx:103`                 | WS-D              |     Fulfillment Versioning     | Snapshot `delivery_url` in order record         |
| **PAY-07**       | `apps/web/app/actions/order.ts:18-178`                          | WS-D, WS-B        |         Rate Limiting          | Enforce order creation rate limits              |
| **PAY-08**       | `packages/db/schema.ts:120-144`                                 | WS-D, WS-C        |        Schema Integrity        | Add CHECK constraints & enum                    |
| **PAY-09**       | `checkout-form.tsx:196-245`, `schema.ts:121`                    | WS-D, WS-E        |       Payment Conversion       | Add optional buyer phone field                  |
| **PAY-10**       | `apps/web/lib/midtrans.ts`, `actions/order.ts`                  | WS-D              |   Cryptographic Verification   | Positive commendation verification              |
| **FE-01**        | `apps/web/app/[username]/page.tsx:167-181`                      | WS-E              |       Product Telemetry        | Add `link.clicks` and `/r/[linkId]` route       |
| **FE-02**        | `apps/web/app/[username]/page.tsx:127-132`                      | WS-E              |     Core Web Vitals (CLS)      | Migrate avatar to `next/image`                  |
| **FE-03**        | `apps/web/app/[username]/page.tsx:63`                           | WS-E              |     Social Graph Metadata      | Use absolute URL in `openGraph.url`             |
| **FE-04**        | `apps/web/app/[username]/page.tsx:168-181`                      | WS-E              |   Accessibility (WCAG 3.2.5)   | Add `sr-only` context for new tabs              |
| **FE-05**        | `apps/web/app/checkout/[productId]/checkout-form.tsx:50`        | WS-E, WS-D        |        Form Validation         | Add buyer phone input & validation              |
| **FE-06**        | `apps/web/app/checkout/[productId]/checkout-form.tsx:204`       | WS-E              |   Accessibility (WCAG 1.3.5)   | Add `autoComplete` attributes                   |
| **FE-07**        | `apps/web/app/order/[accessToken]/order-status-refresh.tsx:7`   | WS-E              |        User Experience         | Add 4-second client polling interval            |
| **FE-08**        | `apps/web/app/checkout/[productId]/checkout-form.tsx:60`        | WS-E              |         Ad-Blocker UX          | Render informative Snap error banner            |
| **FE-09**        | `link-manager.tsx:300`, `product-manager.tsx:403`               | WS-E              |       Creator Experience       | Integrate `@dnd-kit/core` drag-and-drop         |
| **FE-10**        | `apps/web/app/(dashboard)/dashboard/page.tsx:117`               | WS-E              |       Business Dashboard       | Add revenue KPI cards and sales chart           |
| **FE-11**        | `link-manager.tsx:90`, `product-manager.tsx:104`                | WS-E              |      Modal Accessibility       | Replace `window.confirm` with AlertDialog       |
| **FE-12**        | `profile-validation.ts:16`, `[username]/page.tsx:80`            | WS-E              |       Routing Ergonomics       | Add redirects `/links` -> `/dashboard/links`    |
| **FE-13**        | `apps/web/app/` (all route segments)                            | WS-E, WS-A        |      Loading Performance       | Create Next.js `loading.tsx` skeletons          |
| **FE-14**        | `apps/web/app/` (all route segments)                            | WS-E, WS-A        |         Error Handling         | Create Next.js `error.tsx` boundaries           |
| **FE-15**        | `apps/web/app/not-found.tsx`                                    | WS-E              |         User Retention         | Create custom branded 404 page                  |
| **FE-16**        | `(dashboard)/layout.tsx:18`, `login-form.tsx:77`                | WS-E              |        Auth Redirection        | Preserve `callbackUrl` query parameter          |
| **FE-17**        | Monorepo-wide UI                                                | WS-E              |         User Feedback          | Deploy `sonner` toast system                    |
| **FE-18**        | `link-manager.tsx:52`, `product-manager.tsx:64`                 | WS-E              |       Perceived Latency        | Implement React 19 `useOptimistic`              |
| **FE-19**        | 12 locations across `apps/web`                                  | WS-E              |   Accessibility (WCAG 4.1.2)   | Replace `<Link><Button>` with `asChild`         |
| **FE-20**        | `link-manager.tsx:234`, `product-manager.tsx:305`               | WS-E              |   Accessibility (WCAG 1.3.1)   | Add `htmlFor` and `id` to edit form inputs      |
| **FE-21**        | `link-manager.tsx:301`, `product-manager.tsx:404`               | WS-E              |   Accessibility (WCAG 2.5.5)   | Expand touch bounding box to 44x44px            |
| **FE-22**        | `[username]/page.tsx:231`, `order-page.tsx:244`                 | WS-E              |   Accessibility (WCAG 1.4.3)   | Change `text-slate-400` to `text-slate-600`     |
| **FE-23**        | `onboarding-form.tsx:79-89`                                     | WS-E              |        Mobile Keyboard         | Add `autoCapitalize="none"` to username         |
| **FE-24**        | `login-form.tsx:177`, `register-form.tsx:195`                   | WS-E              |         Form Usability         | Add password show/hide toggle button            |
| **FE-H01**       | Public profiles with >30 links                                  | WS-E              |     Performance Hypothesis     | Test `content-visibility: auto`                 |
| **FE-U01**       | Production Edge RUM                                             | WS-E              |    Field Telemetry Unknown     | Deploy `@vercel/speed-insights`                 |
| **QA-01**        | `.prettierignore:1-10`                                          | WS-F, WS-A        |   Quality Gate `pnpm format`   | Update `.prettierignore` exclusions             |
| **QA-02**        | `route.test.ts`                                                 | WS-F              |      Test Concurrency Gap      | Add parallel webhook execution test             |
| **QA-03**        | All 19 test files in `apps/web`                                 | WS-F              |    Integration Reliability     | Deploy Testcontainers PostgreSQL suite          |
| **QA-04**        | Monorepo root                                                   | WS-F, WS-G        |       CI/CD Quality Gate       | Add `.github/workflows/ci.yml`                  |
| **QA-05**        | `vitest.config.ts`                                              | WS-F              |       Quality Standards        | Configure coverage thresholds & Playwright      |
| **OPS-01**       | Live Edge `X-Vercel-Id: sin1::iad1`                             | WS-G              |    Regional Network Latency    | Set `vercel.json` regions to `["sin1"]`         |
| **OPS-02**       | Live Edge `X-Powered-By: Next.js`                               | WS-G              |      Information Exposure      | Set `poweredByHeader: false` in config          |
| **OPS-03**       | Live Production URL                                             | WS-G              |      Brand & Go-to-Market      | Connect custom domain `openlynk.id`             |
| **OPS-CACHE-01** | `apps/web/app/sitemap.ts:5`                                     | WS-G              |      Database Scalability      | Replace force-dynamic with 24h ISR              |
| **OPS-CACHE-02** | `apps/web/app/[username]/page.tsx`                              | WS-G              |        Edge CDN Caching        | Add `revalidate = 60` on public profiles        |
| **OPS-OBS-01**   | Entire codebase (0 monitoring packages)                         | WS-G              |     SRE Incident Response      | Deploy `@sentry/nextjs` & structured logging    |
