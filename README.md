# Openlynk

Openlynk adalah platform _link-in-bio_ open source dan monetisasi kreator yang dirancang khusus untuk pasar Indonesia. Dibangun dari nol dengan standar modern, performa tinggi, dan kontrol penuh atas data kreator.

Lisensi: **AGPL-3.0** (GNU Affero General Public License v3.0).

## Tech Stack

- **Framework:** Next.js (App Router, React Server Components)
- **Bahasa & Typing:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS
- **Database & ORM:** PostgreSQL + Drizzle ORM
- **Autentikasi:** Better Auth
- **Workspace:** pnpm Workspaces
- **Quality Assurance:** ESLint, Prettier, Vitest

## Struktur Monorepo

```text
openlynk/
├── apps/
│   └── web/            # Next.js App Router application
├── packages/
│   ├── auth/           # Better Auth configuration & adapters
│   ├── config/         # Shared TypeScript, ESLint, and tooling configs
│   ├── db/             # Drizzle ORM schema & migrations
│   └── ui/             # Shared UI components and primitives
├── docs/
│   └── DECISIONS.md    # Catatan keputusan arsitektur & teknologi
├── .env.example        # Template konfigurasi environment
└── LICENSE             # GNU Affero General Public License v3.0
```

## Memulai Pengembangan

### Prasyarat

- Node.js >= 20
- pnpm >= 9
- PostgreSQL >= 15

### Instalasi & Skrip

```bash
# Salin konfigurasi environment
cp .env.example .env.local

# Instalasi dependency
pnpm install

# Menjalankan typecheck
pnpm typecheck

# Menjalankan linter
pnpm lint

# Menjalankan unit tests
pnpm test

# Build seluruh workspace
pnpm build
```

## Dokumentasi Arsitektur

Lihat [DECISIONS.md](docs/DECISIONS.md) untuk detail keputusan teknis mengenai AGPL-3.0, Next.js App Router, Drizzle ORM, Better Auth, dan pnpm workspaces.
