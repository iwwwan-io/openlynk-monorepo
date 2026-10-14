# Architectural & Technical Decisions

Dokumen ini mencatat keputusan arsitektural dan teknis utama untuk Openlynk beserta rasional di baliknya.

---

## 1. Lisensi: GNU Affero General Public License v3.0 (AGPL-3.0)

- **Keputusan:** Menggunakan lisensi AGPL-3.0 untuk seluruh repositori Openlynk.
- **Rasional:**
  - Openlynk adalah platform _link-in-bio_ dan monetisasi kreator yang beroperasi sebagai layanan web (SaaS/network server).
  - Lisensi open-source konvensional (seperti MIT atau Apache 2.0) memiliki celah di mana pihak komersial dapat memodifikasi kode, meng-host-nya sebagai layanan proprietary di _cloud_, tanpa mengembalikan modifikasi ke komunitas (_network use loophole_).
  - AGPL-3.0 memastikan bahwa siapa pun yang meng-host versi modifikasi Openlynk melalui jaringan wajib merilis kode sumber modifikasi tersebut dengan lisensi yang sama.
  - Ini melindungi kontribusi komunitas dan menjamin ekosistem kreator tetap bebas dan terbuka.

---

## 2. Web Framework: Next.js (App Router)

- **Keputusan:** Menggunakan Next.js dengan App Router (`apps/web`) dan React Server Components (RSC).
- **Rasional:**
  - **Kinerja Link-in-Bio:** Halaman profil publik kreator (`openlynk.id/@username`) harus memiliki First Contentful Paint (FCP) instan dan SEO optimal. RSC memungkinkan rendering di server dengan payload JavaScript minimal ke browser pengunjung.
  - **Full-stack Terintegrasi:** App Router menyediakan Server Actions dan Route Handlers bawaan, memudahkan interaksi API dan autentikasi tanpa memerlukan server API terpisah di fase awal.
  - **Ekosistem & Hosting:** Kompatibilitas tinggi dengan infrastruktur modern (Node.js, Docker, Vercel, VPS mandiri) serta dukungan ekosistem React yang matang.

---

## 3. ORM: Drizzle ORM (bukan Prisma)

- **Keputusan:** Menggunakan Drizzle ORM dengan PostgreSQL (`packages/db`).
- **Rasional:**
  - **Zero Heavy Binary & Cold Start Cepat:** Prisma mengandalkan engine Rust terkompilasi yang menambah ukuran bundle dan memperlambat _cold start_ pada lingkungan serverless/container. Drizzle murni TypeScript/JavaScript tipis.
  - **SQL-like & Transparan:** Drizzle tidak menyembunyikan query SQL di balik layer abstraksi yang rumit; "jika Anda tahu SQL, Anda tahu Drizzle". Query yang dihasilkan sangat dapat diprediksi dan dioptimalkan.
  - **Type Safety Maksimal:** Drizzle menghasilkan TypeScript types langsung dari definisi skema tanpa tahap generate kode eksternal yang lambat.
  - **Migrasi Terkendali:** Drizzle Kit menyediakan sistem migrasi SQL deklaratif yang bersih, memungkinkan peninjauan file `.sql` sebelum dijalankan ke database produksi.

---

## 4. Autentikasi: Better Auth (bukan Auth.js / NextAuth)

- **Keputusan:** Memilih Better Auth untuk lapisan autentikasi (`packages/auth`).
- **Rasional:**
  - **TypeScript-first & Schema First:** Better Auth dirancang dari awal untuk TypeScript modern dengan _type inference_ yang presisi dan integrasi langsung ke Drizzle ORM.
  - **Manajemen Sesi Modern:** Mendukung sesi berbasis database maupun cookie/JWT yang aman secara default, dilengkapi proteksi CSRF, rotasi token, dan session invalidation.
  - **Bebas Masalah Legacy NextAuth:** Auth.js v5 mengalami masa transisi panjang dan pemecahan API yang kerap menimbulkan instabilitas. Better Auth menawarkan API yang lebih modular, konsisten, dan mudah di-extend untuk fitur seperti multi-tenant atau plugin di masa mendatang.

---

## 5. Monorepo Tooling: pnpm Workspaces & Turborepo

- **Keputusan:** Menggunakan pnpm workspaces untuk manajemen dependensi monorepo dikombinasikan dengan Turborepo untuk orkestrasi task dan caching.
- **Rasional:**
  - **Efisiensi Disk & Cache:** pnpm menggunakan hard-links dan global content-addressable storage, menghemat ruang disk secara signifikan dan mempercepat instalasi dependency.
  - **Isolasi Ketat (No Phantom Dependencies):** Berbeda dengan npm atau Yarn v1 yang men-flatten dependency ke root, pnpm menggunakan symlink terstruktur sehingga paket hanya dapat mengakses dependensi yang secara eksplisit dideklarasikan di `package.json`.
  - **Kombinasi Sempurna dengan Turborepo:** pnpm workspaces menangani isolasi paket dan linking internal (`workspace:*`), sedangkan Turborepo mengorkestrasikan eksekusi task (`build`, `lint`, `typecheck`, `test`, `dev`) dengan dependency graph topologis.

---

## 6. Autentikasi Email & Password serta Server-Side Session Guard

- **Keputusan:**
  - Autentikasi awal difokuskan pada kredensial dasar: email dan kata sandi (tanpa dependensi OAuth atau verifikasi email eksternal di tahap awal).
  - Validasi data pengguna (email, panjang password, nama) dieksekusi secara ketat di sisi server melalui fungsi validasi murni TypeScript tanpa dependensi pustaka skema berlebih.
  - Proteksi rute `/dashboard` diterapkan secara deklaratif pada React Server Components menggunakan `auth.api.getSession({ headers })` dan fungsi guard `isSessionAuthorized`.
- **Rasional:**
  - **Keamanan:** Memvalidasi kredensial dan sesi di server mencegah eksploitasi manipulasi state sisi klien.
  - **Bebas Layout Shift / FOUC:** Verifikasi sesi di server memastikan pengunjung yang belum terotentikasi langsung diarahkan (`redirect("/login")`) pada tingkat HTTP response, tanpa merender data privat atau menampilkan kedipan UI kosong (_flash of unauthenticated content_).
  - **Zero Secrets di Client:** Semua secret (`BETTER_AUTH_SECRET`, database credentials) tetap berada di lingkungan server dan dibaca secara eksklusif via `process.env`.

---

## 7. Model Data Profil Kreator, Pengurutan Link, dan Sanitasi URL

- **Keputusan:**
  - Memisahkan tabel `profile` (username unik huruf kecil, display name, bio opsional maks 160 karakter, avatar URL) dan tabel `link` (posisi urutan integer, status aktif, FK cascade ke profile).
  - Indeks komposit `(profile_id, position)` diterapkan pada tabel `link` untuk menjamin efisiensi tinggi saat merender halaman publik link-in-bio dan query dashboard.
  - Validasi username membatasi hanya huruf kecil, angka, dan garis bawah (`^[a-z0-9_]{3,30}$`), serta memblokir kata kunci rute sistem yang dicadangkan (_reserved keywords_: `login`, `register`, `dashboard`, `api`, `admin`, `settings`, `_next`, dll).
  - Validasi URL tautan secara ketat hanya mengizinkan protokol `http://` dan `https://`, menolak seluruh protokol berbahaya seperti `javascript:`, `data:`, `file:`, dan `vbscript:` untuk mencegah serangan XSS (_Cross-Site Scripting_).
  - Seluruh tautan eksternal pada halaman publik dibuka dengan atribut keamanan `target="_blank"` dan `rel="noopener noreferrer"`.
- **Rasional:**
  - **Keamanan Pengunjung Link-in-Bio:** Platform agregator tautan rentan disalahgunakan dengan skema URI berbahaya (`javascript:...`). Sanitasi di server dan atribut `noopener noreferrer` menutup celah `window.opener` serta serangan phishing dan XSS.
  - **Integritas Routing Aplikasi:** Pemblokiran _reserved keywords_ mencegah benturan rute Next.js dinamis `/[username]` dengan rute sistem aplikasi.
  - **Efisiensi Pengurutan:** Penggunaan integer `position` terindeks memungkinkan komputasi urutan tautan (naik/turun) yang deterministik, cepat, dan mudah di-query di sisi server.

---

## 8. Strategi Koneksi Database (Pooled vs Direct DDL), Route Metadata, dan Kesiapan Deploy Vercel

- **Keputusan:**
  - Memisahkan konfigurasi koneksi database runtime (`DATABASE_URL`, connection pooler mode transaction) dengan koneksi eksekusi migrasi DDL (`DATABASE_URL_DIRECT`, session mode langsung / non-pooled).
  - Mengonfigurasi client driver `postgres-js` dengan `prepare: false` secara default untuk seluruh query aplikasi.
  - Mengimplementasikan Next.js Route Metadata untuk `robots.txt` (`apps/web/app/robots.ts`) dan `sitemap.xml` dinamis (`apps/web/app/sitemap.ts`) yang mengambil seluruh data profil kreator publik langsung dari database.
  - Menetapkan `metadataBase` pada Root Layout (`apps/web/app/layout.tsx`) yang bersumber dari URL aplikasi tunggal (`NEXT_PUBLIC_APP_URL` / `BETTER_AUTH_URL`) agar seluruh tautan canonical dan OpenGraph (OG tags) ter-resolve secara absolut.
  - Memastikan seluruh konfigurasi monorepo siap deploy ke Vercel dengan Root Directory `apps/web`, isolasi environment keys, dan dokumentasi migrasi skema.
- **Rasional:**
  - **Kompatibilitas Connection Pooler Serverless:** Arsitektur serverless (seperti Vercel) membuka banyak koneksi singkat ke Postgres via transaction pooler (Layerbase pooler, Supabase Supavisor, PgBouncer). Transaction pooler tidak mempertahankan state _prepared statements_ antar-koneksi. Mengaktifkan `prepare: false` mencegah error fatal `prepared statement does not exist` atau duplikasi nama statement.
  - **Keandalan Migrasi Skema DDL:** Perintah migrasi skema Drizzle (`drizzle-kit migrate`) menjalankan DDL locks dan transaksi skema yang tidak didukung atau rentan timeout pada pooler transaksi. Mengarahkan migrasi ke `DATABASE_URL_DIRECT` (port 5432 session mode) menjamin migrasi skema selalu atomik dan berhasil.
  - **SEO & Indexing Terstandarisasi:** Route Metadata Next.js menghasilkan `robots.txt` dan `sitemap.xml` yang valid secara native tanpa file statis manual. Sitemap terbarui secara real-time berdasarkan kreator terdaftar di database, memblokir pengindeksan rute privat (`/dashboard`, `/api`), dan didukung absolute OpenGraph URL berkat `metadataBase`.

---

## 9. Adopsi dan Retensi Turborepo untuk Pipeline Orchestration dan Computation Caching

- **Keputusan:**
  - Mempertahankan Turborepo (`turbo`) di atas pnpm Workspaces dengan konfigurasi terpusat pada `turbo.json`.
  - Mengorkestrasikan tugas-tugas monorepo (`build`, `typecheck`, `lint`, `test`, `dev`) melalui pipeline Turborepo.
  - Mendaftarkan environment variables kunci yang mempengaruhi hasil kompilasi (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`) pada `globalEnv` dan task `env` pada `turbo.json`.
  - Mengonfigurasi task `dev` dengan `cache: false` dan `persistent: true` untuk menjamin proses development server tetap interaktif.
- **Rasional:**
  - **Akselerasi Siklus Development lewat Cache & Orkestrasi:** Turborepo dipertahankan secara permanen dalam arsitektur repositori untuk mempercepat siklus development harian dan alur CI/CD melalui komputasi cache (baik lokal maupun Vercel Remote Caching) serta orkestrasi task multi-paket yang terstruktur. Ketika input kode dan konfigurasi tidak berubah, hasil eksekusi langsung diambil dari cache (`FULL TURBO`) tanpa menjalankan ulang kompilasi.
  - **Efisiensi Lingkungan Terbatas (Termux / Linux ARM64):** Kompilasi Next.js 16 dan typechecking multi-paket memakan daya CPU dan baterai yang besar di lingkungan perangkat terbatas. Cache hash Turborepo mengeliminasi kompilasi berulang yang tidak perlu.
  - **Parallelism & Dependency Awareness:** Turborepo menyusun dependency graph secara topologis (`^build`), mengeksekusi task paket-paket yang saling bebas secara paralel, dan hanya menjalankan ulang paket yang benar-benar terdampak perubahan kode.
  - **Isolasi Task Interaktif (`dev`):** Mengatur `cache: false` dan `persistent: true` pada task `dev` memastikan proses server Next.js tidak dicache dan berjalan terus-menerus mendengarkan perubahan file (_hot module replacement_).

---

## 10. Integrasi Google OAuth dengan Better Auth, Default Account Linking, dan Graceful Fallback

- **Keputusan:**
  - Mengintegrasikan Google OAuth sebagai penyedia autentikasi sosial (`socialProviders.google`) di Better Auth (`packages/auth`) yang dikonfigurasi melalui variabel lingkungan `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET`.
  - Mengadopsi mekanisme _graceful degradation_ (fallback halus): Jika `GOOGLE_CLIENT_ID` atau `GOOGLE_CLIENT_SECRET` tidak dikonfigurasi (kosong), tombol "Lanjutkan dengan Google" pada halaman `/login` dan `/register` disembunyikan sepenuhnya di sisi server, dan aplikasi tetap berfungsi normal hanya dengan autentikasi email & kata sandi.
  - Mempertahankan perilaku _account linking_ default dari Better Auth tanpa mengaktifkan auto-linking agresif atau plugin eksternal tambahan.
  - Memanfaatkan skema tabel `account` dan `user` yang telah ada pada Drizzle ORM tanpa perlu melakukan migrasi skema database baru.
  - Mendaftarkan `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` pada `globalEnv` dan task `env` di `turbo.json` serta `.env.example`.
- **Rasional:**
  - **Kemudahan Registrasi & Pengalaman Pengguna (UX):** Pengguna di pasar Indonesia sangat terbiasa dengan "One-click Sign-in" menggunakan akun Google. Menyediakan tombol "Lanjutkan dengan Google" mempercepat proses pendaftaran kreator baru tanpa harus mengetik dan mengingat kata sandi.
  - **Zero Secrets Leakage ke Klien:** Penentuan status aktifnya Google OAuth dieksekusi secara aman di sisi server melalui Server Component (`apps/web/app/login/page.tsx` dan `apps/web/app/register/page.tsx`) dengan memanggil helper `isGoogleAuthEnabled()`, sehingga `GOOGLE_CLIENT_SECRET` tidak pernah diekspos ke browser atau bundle JavaScript publik.
  - **Keamanan Akun (No Account Takeover):** Dengan mempertahankan perilaku default Better Auth untuk _account linking_, akun yang dibuat dengan email & kata sandi tidak akan otomatis terhubung secara diam-diam tanpa verifikasi identitas, mencegah celah pengambilalihan akun (_account takeover_).
  - **Stabilitas Skema Database:** Tabel `account` yang dibuat pada Tahap 1 sudah memuat seluruh kolom OAuth yang diperlukan (`provider_id`, `account_id`, `access_token`, `refresh_token`, `id_token`, `scope`, `access_token_expires_at`), sehingga integrasi ini nol risiko perubahan skema database dan kompatibel langsung dengan DB produksi di Layerbase.
