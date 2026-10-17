# Openlynk Monorepo: Engineering Hardening & Scaling Roadmap

**Project:** Openlynk Monorepo (`openlynk`)  
**Production Domain:** `https://openlynkidmono.vercel.app/`  
**Scope:** Prioritized Backlog Matrix, Phase 1 (7-Day Stabilization Plan), Phase 2 (30-Day Scaling Roadmap), and Resource Allocation Guidance  
**Integrity Mode:** Strict Read-Only Audit, Evidence-First Planning

---

## 1. Prioritized Backlog Matrix (Impact vs. Effort Grid)

All findings across Workstreams A through G are mapped onto a 4-quadrant strategic impact-effort matrix:

```text
       HIGH IMPACT
            ▲
            │  [QUADRANT 1: QUICK WINS]                     [QUADRANT 2: STRATEGIC SHIFTS]
            │  High Impact / Low Effort                      High Impact / High Effort
            │  ──────────────────────────────────────────    ──────────────────────────────────────────
            │  • SEC-08: Fix .env.local database isolation   • FE-13/14: Implement Next.js Route
            │  • SEC-01: Add atomic SQL webhook guard          Resilience (loading.tsx / error.tsx)
            │  • ARCH-02: Fix .prettierignore formatting     • FE-01: Bio link click telemetry & CTR
            │  • ARCH-01: Add turbo.json globalEnv vars      • FE-10: Creator revenue metrics & chart
            │  • ARCH-11: Add HTTP security headers          • ARCH-09: Automated GitHub Actions CI/CD
            │  • OPS-01: Set vercel.json region to sin1      • DB-03: Implement db.transaction() reorder
            │  • FE-19: Fix 12 nested <Link><Button> nodes   • SEC-04: Deploy Upstash Redis rate limiting
            │  • FE-07: Add 4s order status polling interval • PAY-05: Platform fee accounting schema
            │                                                • QA-03: Real PostgreSQL Testcontainers
            │
────────────┼────────────────────────────────────────────────────────────────────────────────────────►
            │                                                                              HIGH EFFORT
            │  [QUADRANT 3: LOW-HANGING ENHANCEMENTS]       [QUADRANT 4: LONG-TERM HARDENING]
            │  Low Impact / Low Effort                       Low Impact / High Effort
            │  ──────────────────────────────────────────    ──────────────────────────────────────────
            │  • OPS-02: Disable X-Powered-By header         • QA-05: Playwright E2E browser test suite
            │  • FE-03: Absolute openGraph.url               • ARCH-10: Root tsconfig composite references
            │  • FE-04: Screen reader context for new tabs   • DB-08: Migrate timestamps to timestamptz
            │  • FE-06: Add autoComplete to checkout form    • DB-09: DB-level CHECK constraints & enum
            │  • FE-22: Improve text-slate-400 contrast      • PAY-06: S3 direct file storage fulfillment
            │  • FE-23: Mobile virtual keyboard optimization • ARCH-08: Deploy live Nextra doc site
            │  • SEC-06: Sanitize production error messages  • OPS-03: Connect custom domain openlynk.id
            │  • ARCH-12: Deduplicate profile queries (cache)
            │
       LOW IMPACT
```

---

## 2. Phase 1: 7-Day Stabilization & Hardening Plan

Phase 1 focuses exclusively on eliminating P0/P1 security vulnerabilities, environment hazards, broken quality gates, and high-friction UX bugs. Every task includes explicit target files, acceptance criteria, and owner roles.

### Day 1: Environment Isolation & Critical Webhook Concurrency Guard

- **Task 1.1: Fix Local Database Environment Isolation (`SEC-08`)**
  - **Owner**: Security Engineer
  - **Files**: `apps/web/.env.local`
  - **Action**: Update `DATABASE_URL` to point to the `openlynk_dev` pooled Layerbase connection string instead of production `iwwwan`.
  - **Acceptance Criteria**: Running `pnpm dev` connects exclusively to `openlynk_dev`. Zero queries execute against `iwwwan` from local machines.
- **Task 1.2: Enforce Atomic SQL Status Downgrade Prevention on Midtrans Webhook (`SEC-01 / BE-01 / DB-01 / PAY-01`)**
  - **Owner**: Lead Backend / Security Engineer
  - **Files**: `apps/web/app/api/webhooks/midtrans/route.ts`
  - **Action**: Update the order update query at line 107 to enforce an atomic SQL `WHERE` clause:
    ```ts
    await db
      .update(order)
      .set(updatePayload)
      .where(
        newStatus !== "paid"
          ? and(eq(order.id, existingOrder.id), ne(order.status, "paid"))
          : eq(order.id, existingOrder.id)
      );
    ```
  - **Acceptance Criteria**: Concurrent execution of `settlement` and `expire` payloads guarantees the order remains `status === 'paid'`.
- **Task 1.3: Enforce Atomic SQL Status Guard on Order Polling Page (`DB-02 / PAY-02`)**
  - **Owner**: Lead Backend Engineer
  - **Files**: `apps/web/app/order/[accessToken]/page.tsx`
  - **Action**: Add `ne(order.status, "paid")` to the `db.update` query at line 79. Fix loose amount check (`SEC-02 / PAY-03`) to require `remote.grossAmount !== null && remote.grossAmount === orderData.amountIdr`.
  - **Acceptance Criteria**: Order status refresh never overwrites `paid` status to `expired`.

### Day 2: Pipeline Environment & Quality Gate Remediation

- **Task 2.1: Fix `.prettierignore` and Restore Green `pnpm format` (`ARCH-02 / QA-01`)**
  - **Owner**: QA Lead
  - **Files**: `.prettierignore`, tracked markdown files
  - **Action**: Add `.agents/`, `.turbo/`, `*.tsbuildinfo`, and `**/next-env.d.ts` to `.prettierignore`. Execute `pnpm format:fix` on tracked markdown files.
  - **Acceptance Criteria**: Executing `pnpm format` returns **Exit Code 0 (PASS)** across the entire repository.
- **Task 2.2: Register Missing Environment Variables in Turborepo (`ARCH-01 / DB-11 / OPS-ENV-01`)**
  - **Owner**: Principal Architect / DevOps Lead
  - **Files**: `turbo.json`
  - **Action**: Add `"DATABASE_URL_DIRECT"` and `"NODE_ENV"` to the `globalEnv` array. Add `globalDependencies` for `eslint.config.mjs`, `vitest.config.ts`, and `packages/config/tsconfig.base.json`.
  - **Acceptance Criteria**: `turbo run build --dry=json` includes `DATABASE_URL_DIRECT` in hash computation.
- **Task 2.3: Remove Turborepo Task Serialization on Lint & Typecheck (`ARCH-06`)**
  - **Owner**: DevOps Lead
  - **Files**: `turbo.json`
  - **Action**: Change `"dependsOn": []` for `typecheck` and `lint` to allow parallel execution across packages.
  - **Acceptance Criteria**: `pnpm typecheck` executes concurrently, reducing run duration.

### Day 3: Edge Infrastructure Optimization & Security Headers

- **Task 3.1: Configure Vercel Serverless Function Region to Singapore (`OPS-01`)**
  - **Owner**: DevOps / SRE Lead
  - **Files**: `vercel.json` (root)
  - **Action**: Create `vercel.json` in the repository root:
    ```json
    {
      "$schema": "https://openapi.vercel.sh/vercel.json",
      "framework": "nextjs",
      "regions": ["sin1"]
    }
    ```
  - **Acceptance Criteria**: Serverless function responses on `GET /login` emit `X-Vercel-Id: sin1::sin1::...`. Trans-Pacific latency penalty eliminated (saving 200–350ms RTT).
- **Task 3.2: Implement HTTP Security Headers in Next.js (`ARCH-11 / SEC-03 / OPS-SEC-01 / OPS-02`)**
  - **Owner**: Security Engineer
  - **Files**: `apps/web/next.config.mjs`
  - **Action**: Configure `headers()` and disable `poweredByHeader`:
    ```javascript
    poweredByHeader: false,
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Frame-Options", value: "DENY" },
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
            { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          ],
        },
      ];
    }
    ```
  - **Acceptance Criteria**: `curl -I` confirms all 5 headers present and `X-Powered-By` absent.

### Day 4: Automated CI/CD Quality Gates & Package Poison Pills

- **Task 4.1: Deploy GitHub Actions CI Pipeline (`ARCH-09 / OPS-CI-01 / QA-04`)**
  - **Owner**: DevOps / QA Lead
  - **Files**: `.github/workflows/ci.yml`
  - **Action**: Create workflow verifying `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` on every push and PR to `main`.
  - **Acceptance Criteria**: Pull requests trigger automated validation and block merge on any failure.
- **Task 4.2: Add `server-only` Compile-Time Defense (`ARCH-07`)**
  - **Owner**: Principal Architect
  - **Files**: `packages/db/src/index.ts`, `packages/auth/src/index.ts`
  - **Action**: Add dependency `server-only` and prepend `import "server-only";` to entry points.
  - **Acceptance Criteria**: Importing `@openlynk/db` in a `"use client"` component halts compilation immediately.
- **Task 4.3: Clean Up Phantom Entry in `@openlynk/config` (`ARCH-03`)**
  - **Owner**: Principal Architect
  - **Files**: `packages/config/package.json`
  - **Action**: Remove `"main": "index.js"` and configure valid exports for shared configs.
  - **Acceptance Criteria**: Package resolves cleanly without file-not-found warnings.

### Day 5: Accessibility Hardening & Form Labels

- **Task 5.1: Fix 12 Nested Interactive Elements Violations (`FE-19`)**
  - **Owner**: Frontend Lead
  - **Files**: 12 locations across `apps/web/app/`
  - **Action**: Replace all instances of `<Link><Button>...</Button></Link>` and `<a><Button>...</Button></a>` with `<Button asChild><Link href="...">...</Link></Button>`.
  - **Acceptance Criteria**: Zero occurrences of `<a><button>` in rendered HTML. WCAG 4.1.2 compliance achieved.
- **Task 5.2: Associate Form Labels with Input IDs (`FE-20`)**
  - **Owner**: Frontend Lead
  - **Files**: `link-manager.tsx`, `product-manager.tsx`
  - **Action**: Add unique `id` attributes to inputs and matching `htmlFor` attributes on all `<Label>` components.
  - **Acceptance Criteria**: Screen readers announce explicit field labels; clicking labels focuses the input.
- **Task 5.3: Expand Mobile Touch Targets on Reorder Buttons (`FE-21`)**
  - **Owner**: Frontend Lead
  - **Files**: `link-manager.tsx`, `product-manager.tsx`
  - **Action**: Expand button touch bounding boxes to minimum 44x44px using pseudo-element hit-testing.
  - **Acceptance Criteria**: Meets WCAG 2.5.5 / 2.5.8 touch target standards.

### Day 6: Route Resilience Components & Color Contrast

- **Task 6.1: Implement Next.js Route Loading Skeletons (`ARCH-04 / FE-13`)**
  - **Owner**: Frontend Lead
  - **Files**: `apps/web/app/loading.tsx`, `(dashboard)/dashboard/loading.tsx`, `[username]/loading.tsx`, `checkout/[productId]/loading.tsx`
  - **Action**: Create animated skeleton components using Tailwind `animate-pulse`.
  - **Acceptance Criteria**: Simulated 2-second database delays render smooth loading skeletons instead of white blank screens.
- **Task 6.2: Implement Route Error Boundaries & Custom 404 (`ARCH-04 / FE-14 / FE-15`)**
  - **Owner**: Frontend Lead
  - **Files**: `apps/web/app/error.tsx`, `apps/web/app/global-error.tsx`, `apps/web/app/not-found.tsx`
  - **Action**: Create user-friendly error screens with `reset()` retry buttons and branded 404 navigation.
  - **Acceptance Criteria**: Uncaught server errors display branded recovery interface with working retry button.
- **Task 6.3: Remediate Text Contrast Ratios (`FE-22`)**
  - **Owner**: Frontend Lead
  - **Files**: `[username]/page.tsx`, `order/[accessToken]/page.tsx`, `link-manager.tsx`
  - **Action**: Replace `text-slate-400` with `text-slate-600` on white backgrounds (achieving 5.7:1 contrast ratio).
  - **Acceptance Criteria**: WCAG 2.1 Level AA color contrast compliance verified.

### Day 7: Order Status Auto-Polling, DB FK Indexes & End-to-End Verification

- **Task 7.1: Implement Automatic Payment Polling on Order Page (`FE-07`)**
  - **Owner**: Frontend / Payments Engineer
  - **Files**: `apps/web/app/order/[accessToken]/order-status-refresh.tsx`
  - **Action**: Add 4-second client interval polling while order status is `'pending'`, auto-revalidating via `router.refresh()`.
  - **Acceptance Criteria**: Paid QRIS/VA transactions automatically transition the order page to "Pembayaran Berhasil" within 4 seconds without manual user interaction.
- **Task 7.2: Add Secondary Indexes on Authentication Tables (`SEC-05 / DB-07`)**
  - **Owner**: Database Architect
  - **Files**: `packages/db/schema.ts`, migration SQL
  - **Action**: Add `index("session_user_id_idx").on(table.userId)` and `index("account_user_id_idx").on(table.userId)`. Generate migration via `pnpm db:generate`.
  - **Acceptance Criteria**: `EXPLAIN` confirms Index Scan on session revocation queries.
- **Task 7.3: Full Monorepo Quality Gate Re-Verification**
  - **Owner**: QA Lead & All Engineers
  - **Action**: Execute `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
  - **Acceptance Criteria**: **All 5 quality gates pass with Exit Code 0**.

---

## 3. Phase 2: 30-Day Strategic Scaling & Feature Roadmap

Phase 2 focuses on core product capabilities, monetization infrastructure, observability, and performance scaling.

```text
========================================================================================================
                               PHASE 2 STRATEGIC TIMELINE (WEEKS 2 - 4)
========================================================================================================
Week 2: Database Integrity, Transactions & Atomic Concurrency
  • Implement db.transaction() on reorderLinkAction and reorderProductAction (DB-03)
  • Implement atomic SQL subqueries for new item position allocation (DB-04)
  • Handle Midtrans Snap fetch network exceptions to eliminate orphaned pending rows (DB-05)
  • Add composite unique index on account(provider_id, account_id) (DB-06)
  • Wrap public profile lookups in React cache() to deduplicate server metadata queries (ARCH-12)
  • Migrate /sitemap.xml from force-dynamic to 24-hour ISR (OPS-CACHE-01)

Week 3: Product Value Proposition & Monetization Infrastructure
  • Implement bio link click telemetry: add link.clicks and /r/[linkId] redirect route (FE-01)
  • Implement creator revenue dashboard: KPI summary cards and sales trend chart (FE-10)
  • Implement platform fee schema accounting: platformFeeIdr, creatorEarningsIdr, payoutStatus (PAY-05)
  • Snapshot delivery_url in order table at purchase time (PAY-06)
  • Add optional buyer phone number field with WhatsApp formatting at checkout (FE-05 / PAY-09)
  • Deploy global toast notification system using sonner in @openlynk/ui (FE-17)

Week 4: Observability, Rate Limiting & Enterprise Reliability
  • Deploy Sentry error tracking (@sentry/nextjs) and Vercel Speed Insights (OPS-OBS-01 / FE-U01)
  • Deploy distributed rate limiting via Upstash Redis (@upstash/ratelimit) on auth and checkout (SEC-04)
  • Migrate creator avatars to next/image with remote patterns and explicit dimensions (FE-02)
  • Implement drag-and-drop link and product reordering with @dnd-kit/core and useOptimistic (FE-09 / FE-18)
  • Setup Testcontainers PostgreSQL integration test suite for real DB constraint validation (QA-03)
  • Connect official custom domain openlynk.id via Vercel DNS and update OAuth callbacks (OPS-03)
========================================================================================================
```

---

## 4. Resource & Team Allocation Guidance

To execute this roadmap efficiently within the recommended timelines, engineering responsibilities are mapped to key specialist roles:

| Engineering Role                     | Primary Focus Areas                                                            | Key Deliverable Ownership                                     |
| ------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **Lead Backend / Security Engineer** | Security hardening, webhook race conditions, session lifecycle, rate limiting  | `SEC-01`, `SEC-02`, `SEC-04`, `SEC-08`, `PAY-01`, `PAY-02`    |
| **Database Architect**               | Schema migrations, transaction boundaries, pooler tuning, composite indexing   | `DB-01` through `DB-12`, `PAY-05`, `PAY-06`                   |
| **Frontend & UX Lead**               | Route resilience components, WCAG accessibility, toast system, mobile UX       | `FE-01` through `FE-24`, `ARCH-04`                            |
| **DevOps / SRE Engineer**            | Edge routing, Vercel regions, security headers, CI/CD pipelines, observability | `OPS-01` through `OPS-03`, `ARCH-01`, `ARCH-09`, `OPS-OBS-01` |
| **QA / Reliability Lead**            | Test suite expansion, concurrency tests, pre-commit hooks, coverage tracking   | `QA-01` through `QA-05`, pre-merge quality gates              |
