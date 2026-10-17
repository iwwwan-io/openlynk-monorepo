# LAPORAN AUDIT REKAYASA SISTEM KOMPREHENSIF (ENGINEERING AUDIT REPORT)

**Proyek:** Openlynk Monorepo (`openlynk`)  
**Domain Produksi Aktif:** `https://openlynkidmono.vercel.app/`  
**Tanggal Pelaksanaan:** 15–16 Oktober 2026  
**Otoritas Audit:** Tim Rekayasa Perangkat Lunak (Teamwork Parallel Orchestrator)  
**Metodologi:** Static Code Analysis, Cryptographic Forensics, Monorepo Architecture Tracing, Quality Gates Execution, dan Live Surface Inspection (Zero Code Mutation & Zero Production Interruption)

---

## 1. EXECUTIVE SUMMARY (RINGKASAN EKSEKUTIF)

Audit rekayasa independen dan paralel telah dilakukan terhadap basis kode monorepo Openlynk serta permukaan produksi aktifnya. Evaluasi ini mencakup 5 pilar utama: arsitektur monorepo, keamanan & privasi kriptografis, integritas basis data & Server Actions, pengalaman pengguna (UX) & aksesibilitas frontend (WCAG), serta kesiapan sistem penjaminan mutu (QA).

### Vonis Forensik Utama: CLEAN & SECURE CORE (DENGAN CATATAN HARDENING)

- **Zero Backdoors / Zero Hardcoded Secrets**: Tidak ditemukan kunci privat aktif, credential database, atau secret token yang di-hardcode di repositori git.
- **Strict Non-Leakage of `delivery_url`**: Tautan produk digital terbukti 100% terlindungi; tidak pernah diekspos pada halaman publik maupun checkout, dan hanya diakses di sisi server saat transaksi berstatus `paid`.
- **Integer IDR Monetary Integrity**: Perhitungan moneter Rupiah murni menggunakan integer tanpa floating-point, dan parameter harga dari klien ditolak demi keamanan server-first.
- **Timing-Safe Crypto**: Verifikasi signature webhook Midtrans SHA-512 menerapkan `crypto.timingSafeEqual`.
- **Quality Gates Suite**: Unit & integration test (184 pengujian), typecheck (strict zero `any`), linting, dan build Next.js 16.4.0 lolos 100%.

---

### Top 5 Temuan Kritis (Top 5 Critical Findings)

| #   | ID Temuan             | Komponen             | Tingkat Keparahan | Ringkasan Masalah                                                                                                                                                                                                                                                                              |
| --- | --------------------- | -------------------- | :---------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **BE-01 / SEC-01**    | Backend / Webhook    |     **High**      | **TOCTOU Race Condition pada Webhook Midtrans**: Idempotensi pencegahan penurunan status dievaluasi di memori aplikasi tanpa klausa atomik SQL `WHERE status != 'paid'`. Notifikasi `settlement` dan `expire` yang tiba bersamaan berpotensi menimpa status pesanan lunas menjadi kedaluwarsa. |
| 2   | **FE-13 & FE-14**     | Frontend / UX        |     **High**      | **Ketiadaan Komponen Resiliensi Rute (`loading.tsx` & `error.tsx`)**: Tidak ada skeleton loader atau boundary penanganan error di seluruh rute Next.js. Latensi database menyebabkan layar putih (_blank screen_) dan galat memicu unstyled framework crash.                                   |
| 3   | **ARCH-01 & ARCH-02** | Arsitektur / Tooling |     **High**      | **Kegagalan Quality Gate `pnpm format` & Variabel Turborepo**: `pnpm format` gagal (Exit code 1) karena `.prettierignore` belum mengecualikan `.agents/**` dan `next-env.d.ts`. Variabel migrasi kritis `DATABASE_URL_DIRECT` belum terdaftar di `turbo.json`.                                 |
| 4   | **FE-19 & FE-20**     | Aksesibilitas (A11y) |     **High**      | **Pelanggaran Semantik Interaktif HTML & Form Labels**: Penggunaan invalid nesting `<Link><Button>` / `<a><button>` di seluruh halaman utama melanggar WCAG 4.1.2. Formulir edit tautan dan produk tidak memiliki asosiasi label-input (`htmlFor`/`id`).                                       |
| 5   | **FE-01 & FE-10**     | Produk / Bisnis      |     **High**      | **Celah Fitur Inti Link-in-Bio (Zero Telemetri Klik & Tanpa Grafik Omset)**: Tautan bio publik belum memiliki pelacakan klik (_click counter_ / CTR) dan dasbor kreator belum memiliki kartu omset transaksi atau grafik tren penjualan.                                                       |

---

### Analisis Risiko Bisnis (Business Risks)

1. **Risiko Akses Pembeli & Reputasi Kreator**: Jika race condition pada webhook terjadi (BE-01), pembeli yang telah mentransfer uang akan mendapati status pesanannya kedaluwarsa dan tautan unduhan terkunci. Hal ini memicu komplain langsung ke kreator dan merusak kepercayaan transaksi.
2. **Risiko Tingkat Konversi (_Cart Abandonment_)**: Ketiadaan loading skeletons (FE-13), kegagalan kontras teks (FE-22), dan tombol reorder/tombol aksi berukuran mikro di bawah standar mobile 48x48px (FE-21) menciptakan friksi interaksi di smartphone, meningkatkan rasio batal beli.
3. **Risiko Daya Saing Platform**: Fitur analitik klik tautan dan grafik performa omset adalah alasan utama kreator memilih platform link-in-bio (seperti Linktree atau Lynk.id). Ketiadaan fitur ini menghambat monetisasi dan retensi kreator.
4. **Risiko Regresi Kode pada Repositori**: Tidak adanya automasi CI pada GitHub Actions (ARCH-09) menyebabkan kepatuhan aturan penjaminan mutu bergantung penuh pada kedisiplinan lokal masing-masing pengembang.

---

### Area yang Belum Diketahui / Hipotesis (Unverified & Hypotheses)

1. **[FE-U01] Performa Riil pada Jaringan Seluler 3G/4G Indonesia (`BELUM DIKETAHUI`)**: Belum ada integrasi Real User Monitoring (RUM) atau pelacak Core Web Vitals (CWV) untuk mengukur metrik LCP, INP, dan CLS aktual dari perangkat pengguna di pelosok daerah.
2. **[FE-H01] Stabilitas Layout Profil Padat Tautan (`HIPOTESIS`)**: Halaman publik profil dengan puluhan link di bawah lipatan diduga dapat mengalami penurunan frame-rate atau minor layout shift saat scrolling cepat pada ponsel entry-level karena ketiadaan `content-visibility: auto`.
3. **[BE-H01] Ketahanan Pooler Layerbase pada Lonjakan Trafik Ekstrem (`HIPOTESIS`)**: Pooler PgBouncer dengan `max: 5` berjalan sangat stabil untuk beban saat ini, namun perlu stress-test untuk memvalidasi batas aman konkurensi saat profil kreator viral di media sosial tanpa adanya rate limiting aplikasi.

---

## 2. ARCHITECTURE MAP (PETA ARSITEKTUR SISTEM)

### Diagram Topologi & Aliran Data Monorepo

```text
                                       +-----------------------------------+
                                       |          Klien Pengguna           |
                                       |   (Web Browser / Mobile App)      |
                                       +-----------------+-----------------+
                                                         │
                                        HTTPS Requests   │   Live Surface:
                                                         │   https://openlynkidmono.vercel.app/
                                                         ▼
                                       +-----------------------------------+
                                       |      apps/web (Next.js 16.4.0)    |
                                       |      Turbopack App Router         |
                                       +--------+-----------------+--------+
                                                │                 │
                           Server Component RSC │                 │ Server Actions
                           & Route Handlers     │                 │ (Mutations & Auth)
                                                ▼                 ▼
                  +-------------------------------+             +-------------------------------+
                  |       @openlynk/auth          |             |        @openlynk/ui           |
                  | Better Auth 1.2.4 (Drizzle)   |             | Primitive Components (Radix)  |
                  | Session Guards & OAuth        |             | Tailwind CSS v3 & Utilities   |
                  +---------------+---------------+             +-------------------------------+
                                  │
                                  ▼
                  +-------------------------------+
                  |        @openlynk/db           |
                  | Drizzle ORM 0.40.0 + Schema   |
                  | postgres-js (prepare: false)  |
                  +---------------+---------------+
                                  │
        ┌─────────────────────────┴─────────────────────────┐
        ▼ (Port 6543 Transaction Pooler)                    ▼ (Port 5432 Direct Session)
+-----------------------------------+             +-----------------------------------+
|     Layerbase PostgreSQL DB       |             |     Drizzle Kit DDL Migrations    |
|   `openlynk_dev` / `iwwwan`       |             |   `pnpm db:migrate` (DATABASE_    |
|  (Runtime Application Queries)    |             |    URL_DIRECT - Direct Conns)     |
+-----------------------------------+             +-----------------------------------+
```

### Tabel Komponen Arsitektur & Teknologi

| Lapisan / Komponen         | Teknologi                       | Peran & Tanggung Jawab                               | File Konfigurasi Kunci                                           |
| -------------------------- | ------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| **Workspace Orchestrator** | pnpm 10.12.4 + Turborepo 2.11.8 | Manajemen monorepo, pipeline caching, build DAG      | `pnpm-workspace.yaml`, `turbo.json`                              |
| **Frontend Framework**     | Next.js 16.4.0 (React 19)       | Server Components, App Router, Client Forms          | `apps/web/next.config.mjs`, `apps/web/package.json`              |
| **Design System**          | Tailwind CSS 3.4.17 + Radix UI  | Shared component primitives (`@openlynk/ui`)         | `packages/ui/src/index.ts`, `apps/web/tailwind.config.ts`        |
| **Autentikasi & Sesi**     | Better Auth 1.2.4               | Manajemen user, password hashing, Google OAuth       | `packages/auth/src/index.ts`, `packages/auth/src/client.ts`      |
| **ORM & Data Layer**       | Drizzle ORM 0.40.0              | Definisi skema, relasi, migrasi SQL, query client    | `packages/db/schema.ts`, `packages/db/src/index.ts`              |
| **Database Driver**        | postgres-js 3.4.5               | Pooler-safe client (`prepare: false`, `max: 5`)      | `packages/db/src/index.ts`                                       |
| **Payment Gateway**        | Midtrans Snap API               | Transaksi QRIS, E-Wallet, VA, dan Webhook            | `apps/web/lib/midtrans.ts`, `apps/web/app/api/webhooks/midtrans` |
| **Testing & Quality**      | Vitest 3.0.5 + ESLint 9 (Flat)  | Unit testing, integration tests, linting, formatting | `vitest.config.ts`, `eslint.config.mjs`, `.prettierignore`       |

### Aliran Data Inti (Core Data Flows)

1. **Alur Profil Publik (`/[username]`)**:
   - `apps/web/app/[username]/page.tsx` mengeksekusi query database server-side terhadap tabel `profile`, `link`, dan `product`.
   - **Privacy Boundary**: Kolom `delivery_url` **TIDAK PERNAH** dipilih pada query Drizzle; hanya atribut judul, deskripsi, harga integer IDR, dan posisi yang dimuat.
2. **Alur Checkout & Transaksi (`/checkout/[productId]`)**:
   - Komponen halaman memuat detail produk dari database. Harga moneter di-render langsung dari server.
   - Pembeli memasukkan nama dan email pada `CheckoutForm`.
   - Server Action `createOrderAction` dieksekusi: mengabaikan parameter harga dari browser, mengambil nominal asli dari database (`product.priceIdr`), memvalidasi batas moneter (min Rp 1.000, max Rp 10.000.000), menyimpan baris `order` berstatus `pending`, dan meminta Snap Token dari Midtrans API.
3. **Alur Webhook Pembayaran Midtrans (`/api/webhooks/midtrans`)**:
   - Midtrans mengirim notifikasi HTTP POST.
   - Route handler menghitung hash SHA-512 dari `order_id + status_code + gross_amount + server_key` dan membandingkannya menggunakan `crypto.timingSafeEqual` (menolak signature tidak valid dengan HTTP 403).
   - Memeriksa keaslian nominal: `gross_amount` Midtrans dicocokkan dengan `amount_idr` database (HTTP 422 jika manipulasi).
   - Memperbarui status pesanan menjadi `paid` dan mencatat `paidAt`.
4. **Alur Akses Produk Digital (`/order/[accessToken]`)**:
   - Mengambil pesanan berdasarkan token 256-bit acak URL-safe (`accessToken`).
   - Server Component mengecek status transaksi: **HANYA JIKA** statusnya adalah `'paid'`, server menjalankan query tambahan untuk mengambil `product.deliveryUrl`.
   - Merender tautan pengiriman dengan atribut keamanan `target="_blank"`, `rel="noopener noreferrer"`, dan header HTTP `referrer: "no-referrer"`.

---

## 3. DETAILED FINDINGS (KATALOG TEMUAN RINCI)

Seluruh temuan berikut diklasifikasikan ke dalam 4 domain teknis dengan status verifikasi yang terbukti melalui baris kode dan eksekusi uji.

---

### A. Backend, Database & Server Actions

#### [BE-01] Penimpaan Status Pesanan Akibat Race Condition pada Webhook Midtrans

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `High`
- **Lokasi File:** `apps/web/app/api/webhooks/midtrans/route.ts` (baris 46–51, 77–83, 107) dan `apps/web/lib/midtrans.ts` (baris 184–192)
- **Langkah Reproduksi:**
  1. Simulasikan pengiriman webhook `settlement` dan webhook `expire` secara bersamaan (konkuren) untuk `order` yang sama dalam status `pending`.
  2. Kedua request membaca status awal sebagai `pending` via `SELECT`.
  3. Keduanya lolos validasi `isStatusDowngradeBlocked`.
  4. Request A menyelesaikan update menjadi `paid`.
  5. Request B mengeksekusi `db.update(order).set({ status: 'expired' }).where(eq(order.id, existingOrder.id))` dan menimpa status pesanan menjadi `expired`.
- **Dampak Bisnis & Pengguna:** Pembeli sah yang sudah membayar kehilangan akses produk digital dan melihat status pesanan kedaluwarsa.
- **Rekomendasi Remediasi:** Tambahkan klausa SQL atomik pada query update:
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

#### [BE-02] Penukaran Posisi Reorder Non-Atomik pada Server Actions

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** `apps/web/app/actions/link.ts` (baris 329–362) dan `apps/web/app/actions/product.ts` (baris 406–439)
- **Langkah Reproduksi:**
  1. Jalankan `reorderLinkAction` atau `reorderProductAction`.
  2. Putuskan koneksi jaringan atau hentikan proses tepat setelah query `db.update` pertama selesai.
  3. Periksa tabel di database: item target telah berubah posisi, sedangkan item pasangan gagal terupdate.
- **Dampak Bisnis & Pengguna:** Urutan link/produk menjadi duplikat atau acak pada profil kreator.
- **Rekomendasi Remediasi:** Bungkus kedua mutasi posisi dalam transaksi atomik:
  ```ts
  await db.transaction(async (tx) => {
    await tx
      .update(product)
      .set({ position: targetPos, updatedAt: new Date() })
      .where(eq(product.id, targetProduct.id));
    await tx
      .update(product)
      .set({ position: prevPos, updatedAt: new Date() })
      .where(eq(product.id, prevProduct.id));
  });
  ```

#### [BE-03 / SEC-05] Ketiadaan Indeks Foreign Key pada Tabel `session` dan `account`

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** `packages/db/schema.ts` (baris 24–53)
- **Langkah Reproduksi:**
  1. Periksa skema SQL `packages/db/drizzle/0000_fantastic_betty_ross.sql`.
  2. Kolom `session.user_id` dan `account.user_id` tidak memiliki indeks b-tree sekunder.
- **Dampak Bisnis & Pengguna:** Setiap query pencarian sesi berdasarkan `userId`, pembersihan sesi logout, atau penghapusan akun (`cascade delete`) memaksa PostgreSQL melakukan _sequential table scan_. Pada skala ribuan user, ini membebani CPU dan meningkatkan latensi.
- **Rekomendasi Remediasi:** Tambahkan indeks komposit/foreign key di `packages/db/schema.ts`:
  ```ts
  export const session = pgTable("session", { ... }, (table) => [
    index("session_user_id_idx").on(table.userId),
  ]);
  export const account = pgTable("account", { ... }, (table) => [
    index("account_user_id_idx").on(table.userId),
  ]);
  ```

#### [BE-04] Ketiadaan Unique Constraint Komposit pada `account(provider_id, account_id)`

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** `packages/db/schema.ts` (baris 37–53)
- **Langkah Reproduksi:**
  1. Lakukan callback OAuth ganda secara simultan dari akun Google yang sama.
  2. Database mengizinkan dua baris akun dibuat untuk provider dan account ID yang identik karena tidak ada unique index komposit.
- **Dampak Bisnis & Pengguna:** Potensi anomali autentikasi dan duplikasi entitas kredensial sosial.
- **Rekomendasi Remediasi:** Tambahkan `uniqueIndex("account_provider_account_idx").on(table.providerId, table.accountId)`.

#### [BE-05] Ketiadaan DB-Level CHECK Constraints untuk Nilai Moneter dan Status Pesanan

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Low`
- **Lokasi File:** `packages/db/schema.ts` (baris 110, 132, 133)
- **Langkah Reproduksi:**
  1. Jalankan query SQL manual `INSERT INTO product (price_idr) VALUES (-50000)`.
  2. Database menerima data tanpa penolakan karena constraint hanya berada di layer validasi TypeScript/Zod.
- **Dampak Bisnis & Pengguna:** Integritas data rentan rusak jika data dimanipulasi melalui skrip migrasi, konsol SQL langsung, atau integrasi pihak ketiga di masa depan.
- **Rekomendasi Remediasi:** Tambahkan CHECK constraints pada DDL database atau gunakan `pgEnum` native PostgreSQL untuk status pesanan.

#### [BE-06] Baris Pesanan Tertinggal Berstatus `pending` Saat Eksepsi Jaringan Snap API

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Low`
- **Lokasi File:** `apps/web/app/actions/order.ts` (baris 69–81, 124–150, 171–177)
- **Langkah Reproduksi:**
  1. Simulasikan kegagalan koneksi keluar (misal DNS timeout) saat pemanggilan `fetch(snapEndpoint)`.
  2. Eksekusi melompat langsung ke blok `catch` baris 171 tanpa memperbarui baris `order` yang telah dibuat.
- **Dampak Bisnis & Pengguna:** Database terisi pesanan yatim piatu (_orphaned pending rows_) yang tidak memiliki token Snap dan tidak pernah bisa diselesaikan.
- **Rekomendasi Remediasi:** Tandai pesanan sebagai `'failed'` pada blok penanganan error Snap API sebelum melempar exception ke antarmuka.

#### [BE-07] Resiko Penimpaan Status pada Polling Aktif Halaman `/order/[accessToken]`

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** `apps/web/app/order/[accessToken]/page.tsx` (baris 64–85)
- **Langkah Reproduksi:**
  1. Halaman order status di-refresh oleh pembeli saat Midtrans mengembalikan status `expired` dari API statusnya.
  2. Namun sesaat sebelum query update dieksekusi, webhook asynchronous telah menetapkan status menjadi `paid`.
  3. Server Component menimpa status di DB menjadi `expired` karena query update tidak memiliki syarat `WHERE status != 'paid'`.
- **Dampak Bisnis & Pengguna:** Status pesanan yang telah lunas tertimpa menjadi kedaluwarsa akibat aktivitas muat ulang halaman.
- **Rekomendasi Remediasi:** Tambahkan `sql`${order.status} != 'paid'`` pada klausa `WHERE` pembaruan polling.

#### [BE-08] Penggunaan Tipe `timestamp` Tanpa Zona Waktu (`without time zone`)

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Low`
- **Lokasi File:** `packages/db/schema.ts` (seluruh definisi timestamp)
- **Langkah Reproduksi:**
  1. Simpan catatan transaksi di server dengan timezone lokal UTC+7 ke instance PostgreSQL yang berjalan di UTC murni.
  2. Data tersimpan tanpa offset zona waktu, menyebabkan distorsi pada audit waktu transaksi dan kedaluwarsa token.
- **Dampak Bisnis & Pengguna:** Potensi kesalahan perhitungan masa kedaluwarsa pesanan dan ketidaksesuaian log audit.
- **Rekomendasi Remediasi:** Ganti seluruh definisi kolom waktu menjadi `timestamp("...", { withTimezone: true })` (`timestamptz`).

---

### B. Keamanan, Kriptografi & Privasi Data

#### [SEC-01] TOCTOU Concurrency Race Condition pada Webhook Status Downgrade Guard

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium` (OWASP A04:2021 Insecure Design / CWE-367)
- **Lokasi File:** `apps/web/app/api/webhooks/midtrans/route.ts:46-54`, `apps/web/lib/midtrans.ts:184-192`
- _(Lihat rincian reproduksi dan remedi pada temuan BE-01; terverifikasi secara silang oleh Security Auditor)._

#### [SEC-02] Verifikasi Nominal Longgar pada Status Sync Saat `remote.grossAmount === null`

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Low` (OWASP A08:2021 Software & Data Integrity / CWE-754)
- **Lokasi File:** `apps/web/app/order/[accessToken]/page.tsx:64-85`, `apps/web/lib/midtrans.ts:255`
- **Langkah Reproduksi:**
  1. Jika Midtrans mengembalikan payload anomali tanpa properti `gross_amount` yang valid, `parseMidtransAmount` menghasilkan `null`.
  2. Pada baris 106, kondisi `remote.grossAmount === null || remote.grossAmount === orderData.amountIdr` mengevaluasi ke `true`.
  3. Status pesanan diizinkan bertransisi ke `paid` tanpa pembuktian keutuhan nominal transaksi.
- **Dampak Bisnis & Pengguna:** Potensi celah verifikasi pembayaran jika terjadi gangguan format payload dari API eksternal.
- **Rekomendasi Remediasi:** Wajibkan kecocokan nominal secara ketat: `remote.grossAmount !== null && remote.grossAmount === orderData.amountIdr`.

#### [SEC-03] Ketiadaan HTTP Security Headers Standar pada Konfigurasi Next.js

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium` (OWASP A05:2021 Security Misconfiguration / CWE-1021)
- **Lokasi File:** `apps/web/next.config.mjs:1-9`
- **Langkah Reproduksi:**
  1. Lakukan curl inspect header pada domain produksi aktif: `curl -I https://openlynkidmono.vercel.app/`.
  2. Header proteksi seperti `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS), dan `Referrer-Policy` tidak dikonfigurasi.
- **Dampak Bisnis & Pengguna:** Rentan terhadap serangan Clickjacking (aplikasi dibungkus dalam iframe berbahaya) dan MIME-type sniffing.
- **Rekomendasi Remediasi:** Definisikan konfigurasi `headers()` pada `next.config.mjs`:
  ```js
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ],
    }];
  }
  ```

#### [SEC-04] Ketiadaan Rate Limiting pada Endpoint Autentikasi dan Pembuatan Pesanan

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium` (OWASP A07:2021 Authentication Failures / CWE-307)
- **Lokasi File:** `apps/web/app/actions/auth.ts:13-123`, `apps/web/app/actions/order.ts:18-178`
- **Langkah Reproduksi:**
  1. Kirim 100 permintaan otomatis berturut-turut ke Server Action `loginAction` atau `createOrderAction`.
  2. Seluruh permintaan diproses tanpa adanya mekanisme throttling berbasis IP atau identifier pengguna.
- **Dampak Bisnis & Pengguna:** Rentan terhadap credential stuffing, brute-force password, spam pendaftaran akun, dan pemborosan kuota API Midtrans Snap.
- **Rekomendasi Remediasi:** Pasang rate limiter berbasis Redis (`@upstash/ratelimit`) pada Next.js middleware (maksimal 5 percobaan login/15 menit, maksimal 10 pembuatan order/10 menit per IP).

#### [SEC-05] Potensi Pembocoran Pesan Error Internal Sistem pada `loginAction` & `registerAction`

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Low` (OWASP A05:2021 Security Misconfiguration / CWE-209)
- **Lokasi File:** `apps/web/app/actions/auth.ts:57, 113`
- **Langkah Reproduksi:**
  1. Picu unhandled exception dari library dependensi pada saat proses registrasi atau login.
  2. Blok `catch` mengembalikan `err.message` mentah ke klien peramban jika tidak cocok dengan pola whitelist sederhana.
- **Dampak Bisnis & Pengguna:** Berpotensi membocorkan path modul internal, parameter database, atau struktur runtime kepada pihak luar.
- **Rekomendasi Remediasi:** Tampilkan pesan generik yang ramah pada lingkungan produksi:
  `message = process.env.NODE_ENV === "production" ? "Terjadi kendala pada sistem. Silakan coba lagi." : err.message;`

#### [SEC-06] Duplikasi Query Profil Antara `generateMetadata` dan Server Component pada `/[username]`

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Low` (Performa & Efisiensi Database Pooler)
- **Lokasi File:** `apps/web/app/[username]/page.tsx:33-42, 89-94`
- **Langkah Reproduksi:**
  1. Buka halaman `/[username]`.
  2. `generateMetadata` mengeksekusi `SELECT` ke tabel `profile`. Sesaat setelahnya, fungsi `PublicProfilePage` mengeksekusi `SELECT` identik ke tabel `profile`.
- **Dampak Bisnis & Pengguna:** Menimbulkan 2 kali roundtrip jaringan ke Layerbase PostgreSQL untuk setiap kunjungan halaman publik tunggal, membebani pooler koneksi saat traffic melonjak.
- **Rekomendasi Remediasi:** Bungkus fungsi fetch profil menggunakan React `cache()` untuk deduplikasi request otomatis.

---

### C. Frontend, UX & Aksesibilitas (WCAG)

#### [FE-01] Ketiadaan Mekanisme Pelacakan Klik Tautan Bio (Click Tracking Telemetry)

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `High`
- **Lokasi File:** `apps/web/app/[username]/page.tsx:167-181`, `packages/db/schema.ts:80-97`
- **Langkah Reproduksi:**
  1. Klik link tautan pada profil publik `https://openlynkidmono.vercel.app/demo`.
  2. Tautan membuka URL eksternal secara langsung tanpa event telemetri atau redirect counter.
- **Dampak Bisnis & Pengguna:** Kreator tidak mendapatkan metrik analitik berapa banyak audiens yang mengklik tautan mereka. Ini menghilangkan nilai jual utama platform link-in-bio.
- **Rekomendasi Remediasi:** Tambahkan kolom integer `clicks` pada skema `link` dan buat Route Handler `/r/[linkId]` untuk mencatat klik sebelum melakukan redirect 307.

#### [FE-07] Ketiadaan Pembaruan Otomatis Status Transaksi pada `/order/[accessToken]`

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `High`
- **Lokasi File:** `apps/web/app/order/[accessToken]/page.tsx:137-140`, `order-status-refresh.tsx:7-28`
- **Langkah Reproduksi:**
  1. Buka halaman order dengan status pending. Teks halaman menyatakan: _"Status akan otomatis diperbarui setelah pembayaran diterima"_.
  2. Selesaikan pembayaran di tab lain. Tab order tidak pernah berubah status kecuali pengguna menekan tombol refresh secara manual.
- **Dampak Bisnis & Pengguna:** Pembeli mengira pembayaran belum diterima dan merasa bingung.
- **Rekomendasi Remediasi:** Pasang auto-polling berkala (setiap 4 detik dengan limit 5 menit) di komponen `OrderStatusRefresh` menggunakan `router.refresh()`.

#### [FE-10] Ketiadaan Tampilan Metrik Analitik dan Grafik Pendapatan Kreator

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `High`
- **Lokasi File:** `apps/web/app/(dashboard)/dashboard/page.tsx:117-164`
- **Langkah Reproduksi:**
  1. Masuk ke `/dashboard`. Halaman hanya menampilkan total tautan dan total produk.
  2. Tidak ada angka akumulasi saldo/omset pesanan lunas dan tidak ada visualisasi chart.
- **Dampak Bisnis & Pengguna:** Kreator tidak dapat memantau performa penjualan produk digital mereka.
- **Rekomendasi Remediasi:** Tambahkan query `sum(amountIdr) where status = 'paid'` dan hadirkan kartu ringkasan omset beserta grafik tren mingguan.

#### [FE-13 & FE-14] Ketiadaan Komponen Resiliensi Rute (`loading.tsx` & `error.tsx`)

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `High`
- **Lokasi File:** Seluruh direktori rute di `apps/web/app/`
- **Langkah Reproduksi:**
  1. Buka rute dinamis saat koneksi database mengalami latensi -> layar putih kosong (_blank screen_) muncul tanpa skeleton.
  2. Simulasikan error server -> halaman crash menampilkan pesan error polos bawaan Next.js tanpa tombol recovery.
- **Dampak Bisnis & Pengguna:** Pengguna mengira aplikasi hang saat loading dan mendapati tampilan rusak saat terjadi gangguan jaringan.
- **Rekomendasi Remediasi:** Buat file `loading.tsx` beranimasi skeleton dan `error.tsx` dengan tombol "Coba Lagi" (`reset()`) di setiap segmen rute.

#### [FE-19] Pelanggaran Aksesibilitas Menyeluruh: Elemen Interaktif Bertumpuk (`<Link><Button>`)

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `High` (WCAG 4.1.2 Name, Role, Value / W3C HTML5 Standard)
- **Lokasi File:** `(marketing)/page.tsx:20`, `[username]/page.tsx:211`, `(dashboard)/layout.tsx:42`, `order/[accessToken]/page.tsx:170`
- **Langkah Reproduksi:**
  1. Buka halaman beranda atau profil kreator, lalu inspect element pada tombol "Mulai Sekarang" atau "Beli".
  2. Ditemukan tag `<a href="..."><button class="...">...</button></a>`.
- **Dampak Bisnis & Pengguna:** Screen reader membaca ganda elemen fokus ("Link, Button"), membingungkan pengguna disabilitas netra. Klik pada browser mobile terkadang memicu event ganda.
- **Rekomendasi Remediasi:** Gunakan prop `asChild` pada `Button`:
  ```tsx
  <Button asChild>
    <Link href="/register">Mulai Sekarang</Link>
  </Button>
  ```

#### [FE-20] Ketiadaan Asosiasi Label dan Input pada Formulir Edit Tautan & Produk

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `High` (WCAG 1.3.1 Info and Relationships)
- **Lokasi File:** `apps/web/app/(dashboard)/dashboard/link-manager.tsx:234-251`, `product-manager.tsx:306-346`
- **Langkah Reproduksi:**
  1. Aktifkan mode edit pada link atau produk di dasbor.
  2. Klik teks label judul atau buka dengan screen reader -> kursor tidak berpindah ke input karena tag `Label` tidak memiliki `htmlFor` dan `Input` tidak memiliki `id`.
- **Dampak Bisnis & Pengguna:** Pengguna disabilitas netra tidak mengetahui konteks kolom input yang sedang diedit.
- **Rekomendasi Remediasi:** Sematkan atribut `htmlFor="edit-title-${id}"` pada `Label` dan `id="edit-title-${id}"` pada `Input`.

#### [FE-21] Ukuran Target Sentuh Tombol Panah Reorder di Bawah Standar Mobile 48x48px

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `High` (WCAG 2.5.5 Target Size)
- **Lokasi File:** `packages/ui/src/components/button.tsx:21-26`, `link-manager.tsx:301-318`, `product-manager.tsx:404-421`
- **Langkah Reproduksi:**
  1. Buka dasbor link di layar smartphone.
  2. Coba tekan tombol panah reorder ▲ dan ▼ yang berukuran fisik hanya ~20x20px.
- **Dampak Bisnis & Pengguna:** Jari pengguna sering meleset atau tidak sengaja menekan tombol toggle di sampingnya.
- **Rekomendasi Remediasi:** Perbesar target sentuh tombol panah menjadi minimal 44x44px menggunakan padding tersembunyi (`after:absolute after:inset-[-8px]`).

#### [FE-22] Rasio Kontras Warna `text-slate-400` Gagal Standar WCAG AA

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium` (WCAG 1.4.3 Contrast Minimum)
- **Lokasi File:** `[username]/page.tsx:231`, `order/[accessToken]/page.tsx:244`, `checkout-form.tsx:232`
- **Langkah Reproduksi:**
  1. Ukur rasio kontras teks `#94a3b8` (`text-slate-400`) pada latar belakang putih `#ffffff`.
  2. Rasio terukur hanya **2.7:1**, jauh di bawah batas minimum WCAG AA sebesar **4.5:1**.
- **Dampak Bisnis & Pengguna:** Teks keterangan penting sangat sulit dibaca oleh pengguna dengan keterbatasan visual atau di bawah sinar matahari.
- **Rekomendasi Remediasi:** Naikkan ketebalan warna teks sekunder ke minimal `text-slate-600` (`#475569`, rasio kontras 5.7:1).

#### [FE-02] Penggunaan Tag Native `<img>` Alih-alih Next.js `<Image>` untuk Avatar

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** `apps/web/app/[username]/page.tsx:128-132`
- **Dampak:** Menyebabkan pergeseran tata letak (CLS) saat gambar avatar dimuat di perangkat seluler dan tidak terkompresi otomatis.
- **Rekomendasi:** Ganti dengan `next/image` dengan dimensi eksplisit dan `priority={true}`.

#### [FE-05] Ketiadaan Validasi dan Input Nomor Telepon Pembeli (Buyer Phone)

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** `apps/web/app/checkout/[productId]/checkout-form.tsx:50-110`, `packages/db/schema.ts:120-144`
- **Dampak:** Dompet digital Midtrans (GoPay/ShopeePay) dan customer support kehilangan kanal notifikasi SMS/WhatsApp instan jika email salah ketik.
- **Rekomendasi:** Tambahkan kolom opsional `buyer_phone` pada tabel `order` dan input telepon pada form checkout.

#### [FE-09] Ketiadaan Drag-and-Drop Reordering untuk Manajemen Tautan & Produk

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** `apps/web/app/(dashboard)/dashboard/link-manager.tsx:300-319`
- **Dampak:** Kreator dengan puluhan tautan harus menekan tombol panah berkali-kali untuk mengubah susunan link.
- **Rekomendasi:** Pasang `@dnd-kit/core` untuk interaksi seret-dan-lepas yang mulus di desktop dan mobile.

#### [FE-11] Penggunaan Dialog Pemblokir Native `window.confirm()` untuk Konfirmasi Hapus

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** `link-manager.tsx:90-94`, `product-manager.tsx:104-108`
- **Dampak:** Memblokir main-thread browser, tampilan kaku, dan sering tidak didukung di dalam in-app browser Instagram/TikTok.
- **Rekomendasi:** Ganti dengan komponen AlertDialog berbasis Radix UI.

#### [FE-15] Ketiadaan Halaman 404 Kustom Berjenjang (`not-found.tsx`)

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** `apps/web/app/not-found.tsx` (tidak ada)
- **Dampak:** Pengunjung yang membuka profil yang tidak ada disuguhi layar 404 hitam-putih bawaan framework.
- **Rekomendasi:** Buat `apps/web/app/not-found.tsx` berdesain resmi Openlynk.

#### [FE-16] Hilangnya Parameter `callbackUrl` Saat Pengalihan Sesi Tamu

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** `apps/web/app/(dashboard)/layout.tsx:18-20`, `login-form.tsx:77`
- **Dampak:** Kreator yang membuka link langsung ke `/dashboard/products` dipaksa kembali ke `/dashboard` setelah login berhasil.
- **Rekomendasi:** Sertakan query param `?callbackUrl=...` dan navigasikan pengguna ke URL tujuan setelah login sukses.

#### [FE-17] Ketiadaan Sistem Notifikasi Umpan Balik (Toast Notifications)

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** Seluruh codebase `apps/web`
- **Dampak:** Aksi mutasi data (simpan link, toggle aktif) tidak memberikan konfirmasi visual instan kepada pengguna.
- **Rekomendasi:** Pasang library `sonner` pada `@openlynk/ui` dan tampilkan toast sukses/gagal di setiap Server Action.

#### [FE-18] Ketiadaan Optimistic UI Updates (`useOptimistic`)

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** `link-manager.tsx`, `product-manager.tsx`
- **Dampak:** UI terasa lambat karena menunggu siklus jaringan sebelum posisi item berpindah.
- **Rekomendasi:** Terapkan React 19 `useOptimistic` untuk respons instan di sisi klien.

---

### D. Arsitektur Monorepo, Build Pipelines & QA

#### [ARCH-01] Variabel Lingkungan Kritis Hilang dari Deklarasi Pipeline `turbo.json`

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `High`
- **Lokasi File:** `turbo.json:4-14`, `packages/db/drizzle.config.ts:6-8`
- **Langkah Reproduksi:**
  1. Periksa `globalEnv` pada `turbo.json`.
  2. Variabel `DATABASE_URL_DIRECT` (diwajibkan untuk migrasi skema DDL di `AGENTS.md`) dan `NODE_ENV` tidak terdaftar.
- **Dampak:** Turborepo tidak menginvalir cache saat variabel koneksi langsung diubah, berisiko mengeksekusi task terhadap target database yang salah.
- **Rekomendasi:** Daftarkan `"DATABASE_URL_DIRECT"` dan `"NODE_ENV"` ke dalam array `globalEnv` di `turbo.json`.

#### [ARCH-02] Kegagalan Quality Gate `pnpm format` Akibat Folder `.agents/` Belum Di-Ignore

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** `.prettierignore:1-10`, `apps/web/next-env.d.ts`
- **Langkah Reproduksi:**
  1. Jalankan `pnpm format` dari root repositori.
  2. Perintah gagal dengan Exit Code 1 karena 23 file (19 file di `.agents/**` dan `next-env.d.ts`) ditandai tidak rapi.
- **Dampak:** Melanggar mandat `AGENTS.md` Bagian 1.5 bahwa seluruh quality gates harus berstatus HIJAU sebelum commit. Memblokir otomasi CI.
- **Rekomendasi:** Tambahkan `.agents/`, `.turbo/`, dan `**/next-env.d.ts` ke dalam `.prettierignore`.

#### [ARCH-03] Phantom Entry Point (`"main": "index.js"`) pada `@openlynk/config`

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** `packages/config/package.json:5-8`
- **Dampak:** File `index.js` tidak ada di `packages/config`. Import langsung ke package tersebut akan memicu error resolusi modul.
- **Rekomendasi:** Hapus deklarasi `"main": "index.js"` atau sediakan entry point yang valid untuk mengekspor aturan ESLint bersama.

#### [ARCH-05] Ketiadaan `globalDependencies` pada `turbo.json` Berisiko Menimbulkan Stale Caches

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** `turbo.json:1-67`
- **Dampak:** Perubahan pada file konfigurasi root (`eslint.config.mjs`, `vitest.config.ts`, `tsconfig.base.json`) tidak memicu re-run otomatis pada paket yang belum berubah kodenya.
- **Rekomendasi:** Tambahkan `"globalDependencies": ["eslint.config.mjs", "vitest.config.ts", "packages/config/tsconfig.base.json"]` pada `turbo.json`.

#### [ARCH-09] Ketiadaan Automasi CI/CD Workflow Pipeline pada Repositori

- **Status:** `TERVERIFIKASI`
- **Tingkat Keparahan:** `Medium`
- **Lokasi File:** Repositori root (folder `.github/workflows` tidak ada)
- **Dampak:** Pemeriksaan lint, test, typecheck, dan build bergantung 100% pada eksekusi manual lokal pengembang; rawan regresi kode masuk ke branch utama.
- **Rekomendasi:** Buat workflow GitHub Actions `.github/workflows/ci.yml` yang menjalankan pemeriksaan quality gates di setiap Pull Request.

---

## 4. VERIFICATION & INSPECTION RESULTS (HASIL EKSEKUSI PENGUJIAN)

Seluruh pengujian dijalankan dalam mode baca saja (_read-only_) tanpa modifikasi kode sumber:

```
========================================================================================
                          QUALITY GATES VERIFICATION MATRIX
========================================================================================
Perintah Eksekusi      Target Cakupan            Durasi    Status Hasil   Catatan Evaluasi
----------------------------------------------------------------------------------------
pnpm format            prettier --check .         47.0s    FAIL (Exit 1)  23 files berantakan (.agents/, next-env)
pnpm test              turbo test (6 packages)     7.7s    PASS (Exit 0)  22 test files, 184 tests lulus (100%)
pnpm typecheck         turbo typecheck (6 pkgs)   16.7s    PASS (Exit 0)  Strict mode, zero errors, zero `any`
pnpm lint              turbo lint (6 packages)    11.1s    PASS (Exit 0)  ESLint Flat Config, 0 error, 0 warning
pnpm build             turbo build (6 packages)   13.3s    PASS (Exit 0)  Next.js 16.4.0 Turbopack (14 routes)
========================================================================================
```

### Rincian Pengujian Unit & Integrasi (`pnpm test`)

- **`apps/web`**: 19 file pengujian, 167 tes lulus.
  - Memverifikasi secara ketat: proteksi harga pesanan, non-leakage `delivery_url`, verifikasi signature SHA-512 Midtrans, mitigasi status downgrade, format monetary integer IDR, dan autentikasi sesi.
- **`@openlynk/db`**: 1 file pengujian, 10 tes lulus (skema Drizzle & koneksi pooler).
- **`@openlynk/auth`**: 1 file pengujian, 5 tes lulus (Better Auth provider & guards).
- **`@openlynk/ui`**: 1 file pengujian, 2 tes lulus (render primitif & tailwind merge).

### Batasan Pengujian (Inspection Limits)

- Tidak ada tes beban konkurensi database Layerbase tingkat tinggi (stress test >1000 RPS).
- Pengujian live surface `https://openlynkidmono.vercel.app/` dibatasi pada inspeksi HTTP header, responsivitas routing, respons status 404, dan integritas rendering publik.

---

## 5. PRIORITIZED BACKLOG (BACKLOG PERBAIKAN BERDASARKAN PRIORITAS)

```
                       PETA PRIORITAS DAMPAK VS TINGKAT KESULITAN
  Tinggi ▲
         │  [QUICK WINS]                         [STRATEGIC SHIFTS]
         │  * BE-01/SEC-01 (Atomic Webhook Guard) * FE-01 (Click Tracking Telemetry)
         │  * ARCH-01/02 (Prettier & Turbo Env)   * FE-10 (Revenue Analytics & Charts)
  D      │  * FE-19 (Button asChild Nesting)     * FE-09 (Drag-and-Drop Reordering)
  A      │  * FE-13/14 (Loading & Error States)   * ARCH-09 (GitHub Actions CI/CD)
  M      │  * FE-07 (Auto-poll Order Status)      * SEC-04 (Rate Limiting Redis)
  P      │
  A      │----------------------------------------------------------------------
  K      │  [LOW-HANGING ENHANCEMENTS]           [LONG-TERM HARDENING]
         │  * FE-20 (Form Labels htmlFor/id)     * BE-03 (Session/Account DB Indexes)
         │  * FE-21 (48x48px Mobile Tap Targets)  * BE-08 (Timestamptz Migration)
         │  * FE-22 (Color Contrast Slate-600)    * BE-05 (Database CHECK Constraints)
         │  * SEC-03 (HTTP Security Headers)      * ARCH-03 (Config Package Refactor)
  Rendah ▼
         └────────────────────────────────────────────────────────────────────────►
           Rendah (1 - 3 Hari)                   Tinggi (1 - 4 Minggu)
                                TINGKAT KESULITAN / WAKTU
```

---

## 6. ENGINEERING ROADMAP (PANDUAN EKSEKUSI 7 HARI & 30 HARI)

### Roadmap 7 Hari Pertama: Stabilitas Kritis & Kepatuhan Standar (Fokus Kualitas & Integritas)

- [ ] **Hari ke-1: Quality Gate & Pipeline Hardening**
  - Perbaiki `.prettierignore` dengan menambahkan `.agents/`, `.turbo/`, dan `**/next-env.d.ts`.
  - Daftarkan `DATABASE_URL_DIRECT` dan `NODE_ENV` ke `globalEnv` pada `turbo.json`.
  - Jalankan `pnpm format:fix` pada file markdown dan pastikan `pnpm format` berstatus HIJAU.
- [ ] **Hari ke-2: Perlindungan Integritas Finansial & Concurrency**
  - Terapkan klausa proteksi atomik `WHERE status != 'paid'` pada `apps/web/app/api/webhooks/midtrans/route.ts` dan `apps/web/app/order/[accessToken]/page.tsx` (`BE-01`, `SEC-01`, `BE-07`).
  - Bungkus penukaran posisi urutan tautan dan produk ke dalam `db.transaction` (`BE-02`).
  - Tolak verifikasi status jika `remote.grossAmount === null` (`SEC-02`).
- [ ] **Hari ke-3: Aksesibilitas Semantik & Interaktivitas Mobile**
  - Ganti seluruh pola `<Link><Button>` dan `<a><Button>` menjadi `<Button asChild><Link ...></Link></Button>` (`FE-19`).
  - Pasangkan atribut `htmlFor` dan `id` pada seluruh formulir edit link & produk (`FE-20`).
  - Perbesar area klik tombol panah reorder menjadi minimal 44x44px (`FE-21`).
  - Naikkan warna teks sekunder dari `text-slate-400` ke `text-slate-600` (`FE-22`).
- [ ] **Hari ke-4: Resiliensi Rute & Halaman Sistem**
  - Buat komponen `loading.tsx` beranimasi skeleton untuk rute `(dashboard)`, `[username]`, dan `checkout` (`FE-13`).
  - Buat `apps/web/app/error.tsx` dan `global-error.tsx` dengan UI pemulihan kesalahan yang ramah (`FE-14`).
  - Buat `apps/web/app/not-found.tsx` berdesain resmi Openlynk (`FE-15`).
- [ ] **Hari ke-5: Pengalaman Status Pesanan & Keamanan Header**
  - Implementasikan interval polling otomatis pada `OrderStatusRefresh` (`order-status-refresh.tsx`) (`FE-07`).
  - Konfigurasikan header keamanan standar di `apps/web/next.config.mjs` (`X-Frame-Options`, `HSTS`, `nosniff`) (`SEC-03`).
- [ ] **Hari ke-6: Penyempurnaan Form Mobile & Autentikasi**
  - Tambahkan atribut `autoComplete="name"` dan `autoComplete="email"` pada checkout (`FE-06`).
  - Sertakan `autoCapitalize="none"` dan `autoCorrect="off"` pada input username onboarding (`FE-23`).
  - Simpan dan teruskan `callbackUrl` saat redirect sesi tamu (`FE-16`).
  - Tambahkan tombol intip password pada form login/register (`FE-24`).
- [ ] **Hari ke-7: Automasi CI & Verifikasi Akhir**
  - Siapkan workflow GitHub Actions `.github/workflows/ci.yml` untuk memvalidasi kelima quality gates di setiap PR (`ARCH-09`).
  - Verifikasi seluruh alur dari pendaftaran hingga transaksi pembayaran di staging.

---

### Roadmap 30 Hari: Skalabilitas, Fitur Produk & Keunggulan Kompetitif

- [ ] **Minggu ke-2 (Hari 8–14): Fitur Inti Link-in-Bio & Analitik Finansial**
  - **Click Tracking Telemetry (`FE-01`)**: Tambahkan kolom `clicks` pada skema `link` dan buat Route Handler redirect `/r/[linkId]`.
  - **Dashboard Analytics & Revenue Card (`FE-10`)**: Hadirkan ringkasan total uang masuk terverifikasi, jumlah pesanan sukses, dan visualisasi chart tren penjualan.
  - **Sistem Notifikasi Global (`FE-17`)**: Pasang pustaka `sonner` pada `@openlynk/ui` untuk memberikan konfirmasi instan di setiap Server Action.
- [ ] **Minggu ke-3 (Hari 15–21): Interaktivitas Modern & Indeks Skema**
  - **Drag-and-Drop Reordering (`FE-09` & `FE-18`)**: Integrasikan `@dnd-kit/core` dengan feedback visual instan (`useOptimistic`).
  - **Indeks Database Autentikasi (`BE-03`, `BE-04`)**: Tambahkan indeks b-tree pada `session.userId` dan `account.userId`, serta unique constraint pada `account(providerId, accountId)`.
  - **Nomor Telepon Pembeli (`FE-05`)**: Dukung input `buyerPhone` berformat E.164 pada formulir checkout dan skema database pesanan.
  - **Dialog Konfirmasi Radix (`FE-11`)**: Ganti `window.confirm()` dengan komponen AlertDialog berbasis Radix UI.
- [ ] **Minggu ke-4 (Hari 22–30): Infrastruktur Skalabilitas & Hardening Lanjutan**
  - **Rate Limiting Middleware (`SEC-04`)**: Integrasikan Upstash Redis untuk membatasi percobaan brute-force login dan order spamming.
  - **Deduplikasi Query Profil (`SEC-06`)**: Terapkan React `cache()` untuk meniadakan double-fetch pada `generateMetadata` dan `PublicProfilePage`.
  - **Migrasi `timestamptz` & CHECK Constraints (`BE-05`, `BE-08`)**: Migrasikan kolom timestamp ke zona waktu eksplisit dan pasang CHECK constraint database.
  - **Server-Only Poison Pill (`ARCH-07`)**: Tambahkan dependensi `server-only` pada `@openlynk/db` dan `@openlynk/auth`.

---

## 7. DECISIONS REQUIRING FOUNDER APPROVAL (KEPUTUSAN STRATEGIS FOUNDER)

Berikut adalah 5 isu fundamental yang memerlukan keputusan bisnis dan arahan dari Founder/Leadership sebelum tim rekayasa melakukan eksekusi:

### 1. Kebijakan Pengiriman Produk Digital: Direct External Link vs Expiring Signed Storage URLs

- **Kondisi Saat Ini**: Produk digital dikirimkan melalui URL eksternal yang diinput kreator (misal: Google Drive, Dropbox, Notion link) yang disimpan pada kolom `product.delivery_url`.
- **Dilema**: Begitu pembeli mendapatkan link tersebut, pembeli dapat membagikan tautan Drive tersebut kepada orang lain secara gratis (_link piracy_).
- **Pilihan Keputusan**:
  - **Opsi A (Status Quo)**: Tetap gunakan URL eksternal langsung. Biaya penyimpanan Rp 0, implementasi sederhana, namun rentan pembajakan tautan.
  - **Opsi B (Native File Upload & Signed URLs)**: Platform Openlynk menyediakan penyimpanan file native (via Cloudflare R2 / AWS S3) dan menghasilkan URL bertanda tangan yang kedaluwarsa dalam 24 jam (_time-limited signed download link_).
  - _Dampak Biaya_: Memerlukan biaya penyimpanan cloud storage dan kuota bandwidth egress.

### 2. Kebijakan Kewajiban Nomor Telepon Pembeli pada Checkout

- **Kondisi Saat Ini**: Checkout hanya mewajibkan nama dan email (`FE-05`).
- **Dilema**: Menambahkan input nomor telepon (WhatsApp) mempermudah push notifikasi status pembayaran Midtrans dan customer service, namun menambah satu tahap formulir yang dapat menurunkan tingkat konversi checkout (_conversion rate_).
- **Pilihan Keputusan**:
  - **Opsi A**: Jadikan nomor telepon sebagai input **Opsional**.
  - **Opsi B**: Jadikan nomor telepon **Wajib** (format nomor WhatsApp Indonesia).

### 3. Penambahan Dependensi Layanan Pihak Ketiga untuk Rate Limiting (Upstash Redis)

- **Kondisi Saat Ini**: Tidak ada rate limiter aplikasi pada endpoint sensitif login, register, dan create order (`SEC-04`).
- **Pilihan Keputusan**:
  - **Opsi A**: Adopsi **Upstash Redis Serverless** (memiliki tier gratis 10.000 request/hari, setup mudah via Next.js Edge Middleware).
  - **Opsi B**: Gunakan in-memory sliding window lokal (tanpa biaya langganan, namun tidak sinkron antar-instance container serverless Vercel).

### 4. Strategi Monorepo untuk Dokumentasi (`@openlynk/docs`)

- **Kondisi Saat Ini**: Folder `docs` didaftarkan sebagai workspace package kosong dengan script `exit 0` (`ARCH-08`), menimbulkan penjadwalan no-op task di Turborepo.
- **Pilihan Keputusan**:
  - **Opsi A**: Hapus `"docs"` dari `pnpm-workspace.yaml` untuk merapikan pipeline Turborepo hingga situs dokumentasi siap dibangun.
  - **Opsi B**: Pertahankan dan segera jadwalkan pembuatan situs dokumentasi publik Openlynk (menggunakan Nextra atau Starlight).

### 5. Model Monetisasi & Kebijakan Biaya Transaksi Platform (Platform Fee)

- **Kondisi Saat Ini**: Penjualan produk digital meneruskan 100% nominal `price_idr` ke transaksi Midtrans Snap tanpa potongan komisi platform Openlynk.
- **Pilihan Keputusan**:
  - Apakah Openlynk akan menerapkan platform fee (misal 5% per transaksi sukses) atau biaya tetap (misal Rp 1.500/transaksi), dan apakah biaya gateway Midtrans dibebankan kepada kreator atau pembeli?
  - _Catatan Rekayasa_: Jika biaya platform diterapkan, skema database tabel `order` harus segera diperluas dengan kolom `platform_fee_idr`, `gateway_fee_idr`, dan `creator_net_amount_idr` sebelum transaksi publik berskala besar berjalan.

---

_Laporan Audit Komprehensif ini difinalisasi dan diajukan oleh Orchestrator Tim Rekayasa untuk menjadi acuan resmi peningkatan mutu Openlynk._
