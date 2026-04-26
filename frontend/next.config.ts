import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for tiny Docker images.
  output: "standalone",
};

export default nextConfig;
