/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@openlynk/ui", "@openlynk/db", "@openlynk/auth"],
};

export default nextConfig;
