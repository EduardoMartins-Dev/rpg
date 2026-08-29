import type { NextConfig } from "next";

// The API used to be a separate Spring Boot service proxied via rewrites
// (see git history). It's now implemented directly as Route Handlers under
// src/app/api/**, so no rewrite/BACKEND_URL is needed anymore.
const nextConfig: NextConfig = {};

export default nextConfig;
