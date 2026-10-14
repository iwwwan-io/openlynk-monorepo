const isTermux = process.platform === "android" || Boolean(process.env.TERMUX_VERSION);
const isVercel = Boolean(process.env.VERCEL);
const isProduction = process.env.NODE_ENV === "production";

// Di lingkungan produksi atau Vercel, nonaktifkan fallback SWC-WASM secara eksplisit
// agar Next.js selalu menggunakan native Rust compiler SWC (berkecepatan penuh).
if (isVercel || (isProduction && !isTermux)) {
  process.env.NEXT_DISABLE_SWC_WASM = "1";
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@openlynk/ui"],
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
