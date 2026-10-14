# Openlynk

Openlynk adalah platform _link-in-bio_ open source dan monetisasi kreator yang dirancang khusus untuk pasar Indonesia. Dibangun dari nol dengan standar modern, performa tinggi, dan kontrol penuh atas data kreator.

Lisensi: **AGPL-3.0** (GNU Affero General Public License v3.0).

## Tech Stack

- **Framework:** Next.js (App Router, React Server Components)
- **Bahasa & Typing:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS
- **Database & ORM:** PostgreSQL + Drizzle ORM
- **Autentikasi:** Better Auth
- **Workspace & Build System:** pnpm Workspaces + Turborepo
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
├── turbo.json          # Konfigurasi pipeline & caching Turborepo
├── .env.example        # Template konfigurasi environment
└── LICENSE             # GNU Affero General Public License v3.0
```

## Memulai Pengembangan Lokal

### Prasyarat

- Node.js >= 20
- pnpm >= 9
- PostgreSQL >= 15 (lokal atau cloud provider seperti Layerbase, Supabase, Neon)

### Konfigurasi Environment Wajib

Salin template environment ke lokasi yang dibaca oleh aplikasi Next.js (`apps/web/.env.local`) dan root monorepo (`.env.local` untuk Drizzle migrations):

```bash
# 1. Salin ke root monorepo
cp .env.example .env.local

# 2. Salin atau buat symlink ke aplikasi web
cp .env.example apps/web/.env.local
# ATAU menggunakan symlink:
# ln -s ../../.env.local apps/web/.env.local
```

> **Akurasi Pembacaan Environment:**
>
> - **Aplikasi Web (`apps/web`):** Next.js membaca environment variables secara native dari `apps/web/.env.local` (atau `apps/web/.env`).
> - **Database Migrations (`packages/db`):** Drizzle Kit (`drizzle.config.ts`) membaca konfigurasi dari root `.env.local`, `packages/db/.env.local`, atau `apps/web/.env.local`.

Buka file `.env.local` dan pastikan variabel-variabel wajib berikut terisi:

- `DATABASE_URL`: Connection string PostgreSQL untuk aplikasi runtime (mode pooled). Runtime `postgres-js` otomatis memakai `prepare: false` agar aman dengan transaction pooler (PgBouncer/Supavisor).
- `DATABASE_URL_DIRECT`: Connection string PostgreSQL langsung (mode direct / non-pooled, port 5432). Digunakan khusus untuk eksekusi migrasi DDL skema Drizzle (`pnpm db:migrate`).
- `BETTER_AUTH_SECRET`: Kunci enkripsi sesi rahasia (minimal 32 karakter).
- `BETTER_AUTH_URL`: URL aplikasi autentikasi (`http://localhost:3000` untuk lokal).
- `NEXT_PUBLIC_APP_URL`: URL basis aplikasi untuk `metadataBase`, `robots.txt`, dan `sitemap.xml` (`http://localhost:3000` untuk lokal).

### Instalasi & Menjalankan Aplikasi

```bash
# 1. Instalasi seluruh dependencies monorepo
pnpm install

# 2. Jalankan migrasi skema database Drizzle
pnpm db:migrate

# 3. Jalankan development server
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

### Verifikasi Kualitas Kode

Sebelum commit kode, pastikan seluruh quality gate hijau:

```bash
# Type checking (TypeScript Strict)
pnpm typecheck

# Linting kode
pnpm lint

# Unit & integration testing (Vitest)
pnpm test

# Build verifikasi seluruh workspace
pnpm build
```

---

## Panduan Deployment ke Vercel

Aplikasi web Openlynk dirancang dalam struktur pnpm monorepo dan siap di-deploy ke Vercel.

### 1. Konfigurasi Proyek di Vercel

Saat mengimpor repositori ke Vercel Dashboard:

- **Framework Preset:** Next.js
- **Root Directory:** Pilih dan set ke `apps/web` (centang _"Include source files outside of the Root Directory in the Build Command"_ agar paket `@openlynk/*` tetap terakses).

### 2. Environment Variables di Vercel

Tambahkan seluruh variabel environment berikut pada menu **Settings > Environment Variables**:

| Variable              | Keterangan & Contoh Nilai                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | Connection string PostgreSQL pooled (misal transaksi port 6543 / pooler). Driver runtime menggunakan `prepare: false`. |
| `DATABASE_URL_DIRECT` | (Opsional) Connection string PostgreSQL direct (port 5432 non-pooled) jika diperlukan untuk DDL.                       |
| `BETTER_AUTH_SECRET`  | Kunci rahasia Better Auth (string acak minimal 32 karakter).                                                           |
| `BETTER_AUTH_URL`     | Domain produksi lengkap, contoh: `https://openlynk.id`                                                                 |
| `NEXT_PUBLIC_APP_URL` | Domain produksi lengkap, contoh: `https://openlynk.id` (digunakan oleh OpenGraph, `robots.txt`, dan `sitemap.xml`).    |

### 3. Migrasi Database Sebelum Deploy

Karena `drizzle-kit migrate` menjalankan perintah DDL yang memerlukan koneksi langsung (non-pooled) dan tidak boleh dijalankan di dalam build command Vercel, jalankan migrasi secara manual dari terminal lokal atau GitHub Actions menggunakan kredensial produksi sebelum melakukan deploy:

```bash
DATABASE_URL_DIRECT="postgresql://..." pnpm db:migrate
```

---

## Dokumentasi Arsitektur

Lihat [DECISIONS.md](docs/DECISIONS.md) untuk detail keputusan teknis mengenai AGPL-3.0, Next.js App Router, Drizzle ORM, Better Auth, pnpm workspaces, penanganan connection pooler (`prepare: false`), serta Route Metadata (`robots.txt` dan `sitemap.xml`).
