# Openlynk AI Agent Guidelines & Rules (AGENTS.md)

Dokumen ini adalah aturan wajib (_mandatory rules_) bagi seluruh AI Coding Assistant / AI Agent (Antigravity, Gemini, Claude, Cursor, Copilot, dll) yang bekerja di repositori Openlynk.

Patuhi seluruh instruksi di bawah ini dengan disiplin tinggi agar tidak menghasilkan kode yang salah arah, tidak aman, atau merusak sistem ("tidak ngawur").

---

## 1. Prinsip Utama & Etika Kerja (Core Principles)

1. **Strict TypeScript (Zero `any`)**:
   - Dilarang keras menggunakan tipe `any`. Gunakan `unknown`, _generics_, _type unions_, atau definisikan tipe/interface eksplisit.
   - Seluruh kode baru wajib lolos pemeriksaan `pnpm typecheck` tanpa error type.

2. **Kalkulasi Moneter & Uang**:
   - Semua nilai uang Rupiah wajib disimpan dan dikomputasi sebagai **integer IDR** (contoh: Rp 25.000 disimpan sebagai `25000`).
   - Dilarang menggunakan tipe float/desimal atau string untuk kalkulasi atau penyimpanan nominal harga/saldo di database.

3. **Validasi Server-First (Pertahanan Berlapis)**:
   - Validasi di sisi klien hanya untuk kenyamanan pengguna (UX). Semua Server Actions dan Route Handlers WAJIB memvalidasi data secara independen di sisi server menggunakan fungsi murni yang diuji unit.
   - Tidak pernah mempercayai parameter harga, judul, nominal, atau status pembayaran yang dikirim dari browser klien.

4. **Zero Secrets di Repository**:
   - Kunci privat (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `MIDTRANS_SERVER_KEY`, dll) dilarang keras di-hardcode di kode sumber, file pengujian, maupun dokumentasi publik.
   - Semua rahasia harus dibaca eksklusif melalui `process.env`. Variabel baru wajib didaftarkan di `.env.example` (tanpa nilai) dan `turbo.json`.

5. **Aturan Git & Quality Gate**:
   - **JANGAN PERNAH `git push`** kecuali diminta secara eksplisit oleh pengguna dengan instruksi langsung (misal: "push ke github").
   - Gunakan format **Conventional Commits** yang atomik dan deskriptif (`feat:`, `fix:`, `docs:`, `style:`, `test:`, `refactor:`, `chore:`).
   - Seluruh quality gate (`pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`) wajib HIJAU sebelum membuat commit.

---

## 2. Aturan Database & Lingkungan (Layerbase PostgreSQL & Drizzle ORM)

1. **Pemisahan Database Produksi vs Dev**:
   - Lingkungan lokal (`.env.local` & `.env`) wajib menunjuk ke **Database Dev (`openlynk_dev`)**.
   - DILARANG KERAS menjalankan migrasi DDL, manipulasi data acak, atau penulisan data uji coba ke **Database Produksi (`iwwwan`)** tanpa instruksi eksplisit dari pengguna.
   - Saat menjalankan migrasi skema, pastikan koneksi menggunakan `DATABASE_URL_DIRECT` (session mode port 5432) dan target database sudah terkonfirmasi.

2. **Strategi Koneksi Drizzle ORM**:
   - Driver `postgres-js` untuk aplikasi runtime wajib menggunakan `{ prepare: false }` karena berkomunikasi via transaction pooler (Layerbase pooler / PgBouncer).
   - Migrasi skema DDL (`drizzle-kit migrate`) wajib menggunakan koneksi langsung (`DATABASE_URL_DIRECT`, non-pooled / port 5432 session mode).

3. **Perubahan Skema Bersifat Additif (Zero Data Loss)**:
   - Skema HANYA didefinisikan melalui `packages/db/schema.ts` dan digenerate menggunakan `pnpm db:generate`.
   - Dilarang melakukan drop kolom atau drop tabel sembarangan yang berpotensi merusak data pengguna eksisting.

---

## 3. Protokol Keamanan & Privasi (Security Guardrails)

1. **Perlindungan Tautan Pengiriman Produk Digital (`delivery_url`)**:
   - `delivery_url` adalah aset privat. DILARANG memilih kolom `delivery_url` pada query halaman publik `/[username]` atau halaman checkout `/checkout/[productId]`.
   - Nilai `delivery_url` tidak boleh bocor ke payload RSC atau HTML browser sebelum pesanan diverifikasi lunas.
   - Pada halaman pesanan `/order/[accessToken]`, `delivery_url` HANYA boleh di-query di sisi server JIKA dan HANYA JIKA status transaksi di database adalah `paid`.
   - Tautan eksternal ke `delivery_url` wajib menggunakan atribut `target="_blank"` dan `rel="noopener noreferrer"`.
   - Halaman `/order/[accessToken]` wajib memiliki konfigurasi metadata `referrer: "no-referrer"` dan `robots: { index: false, follow: false }`.

2. **Keamanan Transaksi & Webhook Midtrans**:
   - Server Action pembuatan pesanan (`createOrderAction`) wajib mengambil harga dan judul produk langsung dari database, tidak boleh dari input formulir browser.
   - Webhook `/api/webhooks/midtrans` wajib memverifikasi tanda tangan kriptografis SHA-512 menggunakan perbandingan _timing-safe_ (`crypto.timingSafeEqual`). Jika signature salah, tolak dengan HTTP 403 tanpa mengubah data.
   - Webhook wajib mencocokkan nominal `gross_amount` dengan `amount_idr` di database (tolak HTTP 422 jika tidak cocok).
   - **Idempotensi**: Webhook duplikat harus aman. Status transaksi yang telah berstatus `paid` TIDAK BOLEH diturunkan (_downgraded_) ke status lain apa pun. Status pesanan HANYA boleh berubah melalui webhook server yang terverifikasi.

3. **Sanitasi URL & Username**:
   - Validasi URL tautan link-in-bio secara ketat hanya mengizinkan protokol `http://` dan `https://` (tolak skema berbahaya seperti `javascript:`, `data:`, `file:`, `vbscript:`).
   - Validasi username kreator wajib memblokir kata kunci sistem yang dicadangkan (`RESERVED_USERNAMES`).

---

## 4. Struktur Kode & Standar Arsitektur Monorepo

1. **Pembagian Paket (pnpm Workspaces + Turborepo)**:
   - `@openlynk/ui` (`packages/ui`): Komponen UI primitif bersama (shadcn/ui, Tailwind CSS v3).
   - `@openlynk/db` (`packages/db`): Skema Drizzle ORM, migrasi SQL, dan database client.
   - `@openlynk/auth` (`packages/auth`): Konfigurasi Better Auth dan adapter autentikasi.
   - `@openlynk/config` (`packages/config`): Shared configuration (ESLint, TSConfig).
   - `apps/web`: Aplikasi Next.js App Router (pages, layouts, server actions, route handlers).

2. **Pencatatan Keputusan Teknis**:
   - Setiap keputusan arsitektur, pemilihan pustaka baru, atau penetapan pola desain wajib dicatat secara terstruktur di `docs/DECISIONS.md`.

---

## 5. Alur Kerja Verifikasi Sebelum Melaporkan Tugas (Quality Checklist)

Sebelum melaporkan pekerjaan selesai kepada pengguna atau membuat commit, jalankan urutan quality gate berikut dan pastikan semuanya HIJAU:

```bash
# 1. Format kode otomatis
pnpm format:fix

# 2. Verifikasi formatting
pnpm format

# 3. Jalankan unit & integration tests
pnpm test

# 4. Strict Typecheck (TypeScript)
pnpm typecheck

# 5. Linting (ESLint)
pnpm lint

# 6. Production Build (jika ada perubahan rute, layout, atau konfigurasi package)
pnpm build
```

---

## 6. Sikap & Kebiasaan yang Dilarang Keras (Do NOTs)

- ❌ **Dilarang berspekulasi:** Jangan berasumsi ada file atau tabel tertentu tanpa memeriksa keberadaannya dengan tool baca/inspeksi terlebih dahulu.
- ❌ **Dilarang mematikan / membypass test:** Jangan menghapus assertion atau menonaktifkan test suite hanya agar build terlihat hijau. Perbaiki akar permasalahannya.
- ❌ **Dilarang polling loop:** Jangan menjalankan loop manual untuk memeriksa status background task; sistem messaging reaktif akan memberikan notifikasi otomatis.
- ❌ **Dilarang mengubah konfigurasi build tanpa alasan:** Jangan mengutak-atik `turbo.json`, `pnpm-workspace.yaml`, atau `next.config.mjs` kecuali memang relevan dengan instruksi tugas.
