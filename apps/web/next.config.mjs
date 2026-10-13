/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@openlynk/ui"],
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
