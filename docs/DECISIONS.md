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

## 5. Monorepo Tooling: pnpm Workspaces

- **Keputusan:** Menggunakan pnpm workspaces untuk manajemen monorepo.
- **Rasional:**
  - **Efisiensi Disk & Cache:** pnpm menggunakan hard-links dan global content-addressable storage, menghemat ruang disk secara signifikan dan mempercepat instalasi dependency.
  - **Isolasi Ketat (No Phantom Dependencies):** Berbeda dengan npm atau Yarn v1 yang men-flatten dependency ke root, pnpm menggunakan symlink terstruktur sehingga paket hanya dapat mengakses dependensi yang secara eksplisit dideklarasikan di `package.json`.
  - **Monorepo Ringan:** Tanpa overhead tooling monorepo yang kompleks (seperti Turborepo/Nx berlebihan di tahap awal), pnpm workspaces sudah menyediakan kemampuan filtering (`pnpm -r`, `pnpm --filter`) yang cukup tangguh untuk skala MVP.
