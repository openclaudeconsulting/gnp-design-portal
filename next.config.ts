import type { NextConfig } from "next";

/**
 * Static export — the portal is served as static HTML from a subpath
 * (`/design-portal/`) on the GNP Steel Trusses Cloudflare Pages site
 * (southern-barn-builders repo). This works today because the wizard is
 * fully client-side. When chunk (e) adds server-side API routes for DB
 * persist + n8n submission, this deploy path will need to move to either
 * Cloudflare Pages Functions or Vercel.
 */
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/design-portal",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
