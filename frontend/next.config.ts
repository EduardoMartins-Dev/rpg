import type { NextConfig } from "next";

// Proxy /api/* to the Spring Boot backend so the browser talks same-origin
// (no CORS). Override the target with BACKEND_URL in other environments.
const backend = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
