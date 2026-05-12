/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Native modules must be loaded by Node, not bundled by webpack.
  experimental: {
    serverComponentsExternalPackages: [
      "better-sqlite3",
      "@prisma/adapter-better-sqlite3",
      "@prisma/client",
    ],
  },
};

export default nextConfig;
