import type { NextConfig } from "next";

// Proxy /api/* to the Spring Boot backend so the browser talks same-origin
// (no CORS). O destino do rewrite é resolvido em BUILD-TIME e gravado no
// routes-manifest — então BACKEND_URL precisa existir no build (na Vercel também).
// Fallback: localhost em dev, API de produção em prod (evita login quebrado se a
// env não estiver setada no build da Vercel).
const PROD_BACKEND = "https://portal-rpg-api.onrender.com";
const backend =
  process.env.BACKEND_URL ??
  (process.env.NODE_ENV === "production" ? PROD_BACKEND : "http://localhost:8080");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
