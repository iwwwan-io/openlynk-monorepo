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

---

## 11. Arsitektur shadcn/ui Monorepo di packages/ui, Route Groups Next.js, dan Segment Reserved Usernames

- **Keputusan:**
  - Mengintegrasikan komponen shadcn/ui ke dalam monorepo dengan meletakkan seluruh komponen UI bersama (`Button`, `Input`, `Label`, `Textarea`, `Card`, `Badge`) serta fungsi utilitas `cn` (`clsx` + `tailwind-merge`) di dalam paket `@openlynk/ui` (`packages/ui`).
  - Mengikuti versi Tailwind CSS yang terpasang di `apps/web` (Tailwind CSS v3) dengan konfigurasi token desain CSS variables murni tanpa dark mode dan tanpa abstraksi tema kustom yang berlebihan.
  - Mengorganisasikan rute Next.js App Router ke dalam _Route Groups_: `(marketing)`, `(auth)`, dan `(dashboard)` tanpa mengubah URL eksternal sama sekali.
  - Mengimplementasikan server session guard terpusat pada layout `apps/web/app/(dashboard)/layout.tsx` menggunakan `auth.api.getSession()` yang memverifikasi sesi pengguna di sisi server sebelum merender navigasi dasar (nama aplikasi "Openlynk", tautan ke halaman publik kreator, dan tombol logout), sembari tetap mempertahankan verifikasi sesi mandiri pada setiap Server Action dan halaman dashboard.
  - Memperluas daftar `RESERVED_USERNAMES` pada `apps/web/lib/profile-validation.ts` dengan segmen-segmen top-level rute yang akan digunakan oleh aplikasi: `checkout`, `order`, `orders`, `products`, `links`, `settings`, dan `webhooks`.
- **Rasional:**
  - **Single Source of Truth untuk Komponen UI:** Menyimpan komponen primitif di `packages/ui` memungkinkan reuse komponen di seluruh aplikasi monorepo masa depan, menghindari fragmentasi styling, dan memudahkan pemeliharaan konsistensi desain UI/UX.
  - **Pemisahan Tanggung Jawab Melalui Route Groups:** Penggunaan Route Groups `(marketing)`, `(auth)`, `(dashboard)` memungkinkan isolasi layout spesifik (seperti shell navigasi dashboard dengan session guard) tanpa mempengaruhi URL publik atau menambahkan segmen path yang tidak diinginkan pada URL browser.
  - **Defense-in-Depth untuk Keamanan Sesi:** Menempatkan server session guard pada `(dashboard)/layout.tsx` memberikan lapisan keamanan pertama yang mencegah render komponen dashboard bagi pengunjung tanpa sesi aktif, sementara pengecekan session di setiap Server Action dan halaman tetap dipertahankan untuk menjamin zero unauthorized access pada level aksi data.
  - **Pencegahan Konflik Routing Profil Kreator:** Karena halaman publik kreator beroperasi pada segmen dinamis top-level `/[username]`, segmen sistem penting seperti `checkout`, `order`, `orders`, `products`, `links`, `webhooks`, dan `settings` harus dicadangkan (`RESERVED_USERNAMES`) agar pendaftaran username baru tidak pernah menimpa atau menabrak rute fungsional aplikasi.

---

## 12. Model Data Produk Digital, Keamanan Delivery URL, dan Sub-routing Dashboard (Tahap 7a)

- **Keputusan:**
  - Menambahkan tabel `product` pada `packages/db/schema.ts` secara additif dengan kolom `id`, `profile_id` (FK `profile`, cascade), `title`, `description` (nullable), `price_idr` (integer Rupiah), `delivery_url` (text), `position` (integer default 0), `is_active` (boolean default true), timestamps (`created_at`, `updated_at`), serta indeks komposit `product_profile_position_idx` pada `(profile_id, position)`.
  - Mengimplementasikan validasi server berbasis fungsi murni TypeScript (`apps/web/lib/product-validation.ts`) dan unit test komprehensif:
    - `title`: wajib, maksimal 100 karakter.
    - `description`: opsional (nullable), maksimal 500 karakter.
    - `price_idr`: wajib integer IDR (tipe number), minimal Rp 1.000, maksimal Rp 10.000.000, menolak desimal, angka negatif, maupun string.
    - `delivery_url`: wajib berupa URL valid dengan protokol `http://` atau `https://`, maksimal 500 karakter.
  - Menerapkan perlindungan autentikasi dan otorisasi kepemilikan profil (`profileId === userProfile.id`) pada seluruh Server Action produk (`createProductAction`, `updateProductAction`, `deleteProductAction`, `toggleProductActiveAction`, `reorderProductAction`).
  - Memecah dashboard menjadi sub-route modular:
    - `/dashboard`: ringkasan statistik (jumlah tautan aktif, jumlah produk digital aktif) dan pengaturan profil kreator.
    - `/dashboard/links`: antarmuka `LinkManager` untuk manajemen tautan link-in-bio.
    - `/dashboard/products`: antarmuka `ProductManager` untuk CRUD produk digital, toggle status aktif, dan pengaturan urutan naik/turun.
    - Navigasi tab terpusat pada `(dashboard)/layout.tsx` (`DashboardTabs`) dengan deteksi tab aktif via `usePathname()`.
    - Redirect guard: jika pengguna belum memiliki profil, akses ke `/dashboard/links` dan `/dashboard/products` otomatis dialihkan ke `/dashboard` untuk menyelesaikan formulir onboarding.
  - Menerapkan perlindungan keamanan ketat pada halaman publik `/[username]`:
    - Query Drizzle secara eksplisit hanya memilih kolom publik (`id`, `title`, `description`, `priceIdr`, `position`), mengecualikan kolom `delivery_url`.
    - Nilai `delivery_url` tidak pernah dirender ke HTML atau diserialisasi ke dalam payload RSC browser.
    - Menampilkan kartu produk digital aktif di bawah tautan bio dengan format harga Rupiah (`Rp 25.000`) dan tombol "Segera hadir" nonaktif (`disabled`).
    - Suite pengujian keamanan otomatis (`page.test.tsx`) memverifikasi proyeksi query database dan memastikan tidak ada kebocoran URL pengiriman.
  - Menetapkan batasan di luar lingkup Tahap 7a: alur checkout, gerbang pembayaran, upload file aset lokal/S3, diskon kupon promosi, dan produk gratis (harga Rp 0).
- **Rasional:**
  - **Integritas Moneter Rupiah:** Penggunaan integer IDR mencegah distorsi pembulatan floating-point pada kalkulasi moneter dan selaras dengan standar transaksi Rupiah di Indonesia tanpa subunit sen.
  - **Zero Leakage Proteksi Aset Digital:** Tautan pengiriman (`delivery_url`) adalah aset privat yang hanya boleh diberikan kepada pembeli setelah pembayaran berhasil di tahap berikutnya. Menghilangkan kolom tersebut pada tingkat proyeksi SELECT database menjamin data sensitif tidak pernah menyentuh browser publik sebelum sistem verifikasi pesanan terpasang.
  - **Modularitas dan Skalabilitas Dashboard:** Memecah dashboard ke sub-route (`/dashboard`, `/dashboard/links`, `/dashboard/products`) merapikan hierarki aplikasi, meringankan render tree setiap halaman, serta mempersiapkan arsitektur navigasi yang bersih untuk fitur transaksi dan analitik di tahap selanjutnya.

---

## 13. Checkout Digital Midtrans Snap, Verifikasi Webhook Idempoten, dan Perlindungan Akses Pesanan (Tahap 7b)

- **Keputusan:**
  - Menambahkan tabel `order` pada `packages/db/schema.ts` secara additif dengan kolom:
    - `id`: primary key `uuid` (`defaultRandom()`).
    - `product_id`: foreign key ke `product.id` dengan relasi `onDelete: 'restrict'` untuk mencegah penghapusan produk yang memiliki riwayat pesanan.
    - `buyer_name` (varchar 100) dan `buyer_email` (varchar 254).
    - `product_title` (varchar 100, snapshot judul saat checkout) dan `amount_idr` (integer, snapshot harga saat checkout).
    - `status`: enum status (`pending`, `paid`, `expired`, `failed`) dengan nilai bawaan `pending`.
    - `midtrans_order_id`: string unik maksimal 50 karakter (format: `ORDER-${timestamp}-${randomHex}`) untuk referensi pembayaran di sistem Midtrans.
    - `access_token`: token acak 32-byte kriptografis berformat `base64url` yang unik untuk akses halaman status dan pengiriman pesanan.
    - `paid_at`: timestamp nullable yang dicatat saat status menjadi `paid`.
    - `created_at` dan `updated_at`: timestamps.
    - Indeks komposit/indeks terpisah: `order_product_id_idx` pada `product_id` dan `order_status_idx` pada `status`.
  - Memperbarui `deleteProductAction` di `apps/web/app/actions/product.ts` agar memeriksa keberadaan pesanan sebelum menghapus, serta menangkap kode error Postgres `23503` (foreign key constraint violation) untuk mengembalikan pesan ramah kepada kreator: `"Produk sudah punya pesanan, nonaktifkan saja"`.
  - Mengimplementasikan alur checkout tanpa akun pembeli:
    - Rute `/checkout/[productId]` sebagai Server Component yang memvalidasi ketersediaan dan status aktif produk (mengembalikan `notFound()` jika tidak ditemukan atau nonaktif), serta memproyeksikan data produk tanpa memilih kolom `delivery_url`.
    - Validasi server murni (`validateBuyerName`, `validateBuyerEmail`) untuk input formulir nama (2–100 karakter) dan email (format valid RFC 5322, maksimal 254 karakter).
    - Server Action `createOrderAction`: Judul produk (`product_title`) dan harga (`amount_idr`) diambil secara eksklusif dari database melalui SELECT pada server, sama sekali tidak memercayai parameter harga atau judul dari input browser klien.
    - Mengintegrasikan Midtrans Snap API (`POST /snap/v1/transactions`) dengan Basic Auth (`MIDTRANS_SERVER_KEY`), parameter `order_id`, `gross_amount`, `customer_details`, dan `item_details`. Jika panggilan API Midtrans gagal, pesanan ditandai sebagai status `failed` dan menampilkan pesan kesalahan yang ramah kepada pengguna.
    - Integrasi Snap di browser klien: Memuat script `snap.js` (sandbox vs production berdasarkan `NEXT_PUBLIC_APP_URL` / env) menggunakan `MIDTRANS_CLIENT_KEY`, lalu memanggil `window.snap.pay(token)`. Seluruh callback sisi klien (`onSuccess`, `onPending`, `onError`, `onClose`) hanya mengarahkan navigasi browser ke `/order/[accessToken]`. Klien dilarang keras mengubah status pesanan di database.
    - Memperbarui tombol produk pada halaman publik `/[username]` dari "Segera hadir" menjadi tombol aktif "Beli" yang mengarahkan pembeli ke `/checkout/[productId]`.
  - Mengimplementasikan Route Handler Webhook `/api/webhooks/midtrans` (POST):
    - Verifikasi signature SHA-512 (`crypto.createHash("sha512").update(order_id + status_code + gross_amount + server_key).digest("hex")`) menggunakan perbandingan _timing-safe_ (`crypto.timingSafeEqual`) untuk mencegah serangan _timing attack_. Jika tanda tangan tidak cocok, kembalikan HTTP 403 tanpa memodifikasi data.
    - Validasi pencarian pesanan: Jika `order_id` tidak ditemukan di database, kembalikan HTTP 404.
    - Validasi nominal `gross_amount`: Mem-parsing string nominal dari Midtrans (misal `"25000.00"`) dan membandingkannya secara presisi dengan `amount_idr` pesanan. Jika ada ketidakcocokan, tolak dengan HTTP 422.
    - Pemetaan status transaksi:
      - `settlement` -> `paid` (mengisi `paid_at`).
      - `capture` dengan `fraud_status === "accept"` -> `paid` (mengisi `paid_at`).
      - `pending` -> `pending`.
      - `expire` -> `expired`.
      - `deny`, `cancel`, `failure` -> `failed`.
    - Desain Idempoten: Webhook duplikat ditangani dengan aman. Status yang telah berstatus `paid` tidak boleh diturunkan (_downgraded_) ke status lain apa pun. Handler selalu mengembalikan respons HTTP 200 setelah diproses. Status pesanan HANYA boleh berubah melalui webhook terverifikasi di server.
  - Halaman status `/order/[accessToken]`:
    - Menggunakan konfigurasi `export const dynamic = "force-dynamic"` dan metadata `robots: { index: false, follow: false }` serta `referrer: "no-referrer"` untuk mencegah pengindeksan mesin pencari, cache browser, dan kebocoran token akses pesanan via header HTTP Referer.
    - Jika `status === "pending"`, menampilkan antarmuka "Menunggu pembayaran" dan tombol muat ulang status (`OrderStatusRefresh`).
    - Jika `status === "paid"`, menampilkan judul produk, tombol/tautan langsung ke `delivery_url` yang diproteksi dengan atribut keamanan `target="_blank"` dan `rel="noopener noreferrer"`, serta pesan peringatan jelas: _"Simpan link halaman ini. Kami belum mengirim email."_
    - Jika `status === "expired"` atau `"failed"`, menampilkan pesan kesalahan status beserta tautan kembali ke profil kreator.
    - Keamanan Akses `delivery_url`: Query utama pesanan tidak memilih `delivery_url`. Nilai `delivery_url` hanya di-query secara sekunder di sisi server JIKA dan HANYA JIKA status pesanan terbukti `paid`.
  - Aturan Robots & Crawlers (`apps/web/app/robots.ts`):
    - Menambahkan rute internal dan privat ke daftar disallow: `/checkout`, `/order`, dan `/api/webhooks`.
  - Batasan di luar lingkup Tahap 7b:
    - Saldo/payout kreator, pengiriman email konfirmasi/notifikasi transaksi, kupon diskon, produk gratis, refund, dan registrasi akun pembeli.
- **Rasional:**
  - **Zero Trust pada State Klien:** Keamanan pembayaran digital bergantung pada prinsip bahwa klien browser tidak pernah dapat dipercaya untuk menentukan harga barang, status pembayaran, atau kelayakan akses link unduhan. Mengunci harga dari database dan hanya memperbarui status melalui webhook dengan verifikasi kriptografis SHA-512 menutup celah manipulasi transaksi (_tampering_).
  - **Idempotensi & Ketahanan Webhook:** Midtrans dapat mengirimkan notifikasi berulang untuk transaksi yang sama atau mengirimkan notifikasi dalam urutan yang tertukar. Memblokir penurunan status dari `paid` ke status non-paid menjamin hak akses pembeli tidak pernah hilang akibat anomali transmisi jaringan.
  - **Dua Lapis Isolasi Data Aset Digital:** Tautan produk digital (`delivery_url`) dilindungi di dua titik: (1) tidak pernah disertakan dalam query publik `/[username]` maupun formulir `/checkout/[productId]`, dan (2) pada halaman `/order/[accessToken]`, URL pengiriman hanya diambil dari database apabila status transaksi di database telah diverifikasi `paid`.
  - **Integritas Relasi Basis Data:** Penggunaan relasi `onDelete: 'restrict'` pada tabel pesanan mencegah skenario di mana seorang kreator menghapus produk yang telah dibayar pembeli, menjamin audit trail transaksi dan akses unduhan pembeli tetap terjaga.
