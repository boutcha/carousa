import type { NextConfig } from "next";

// PostHog EU cloud by default; override at build time for US cloud.
const POSTHOG_INGEST =
  process.env.POSTHOG_INGEST_HOST ?? "https://eu.i.posthog.com";
const POSTHOG_ASSETS =
  process.env.POSTHOG_ASSETS_HOST ?? "https://eu-assets.i.posthog.com";

const nextConfig: NextConfig = {
  // First-party /ingest reverse proxy so analytics survive ad blockers.
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSETS}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${POSTHOG_INGEST}/:path*`,
      },
    ];
  },
  // PostHog API calls use trailing slashes; don't let Next redirect them.
  skipTrailingSlashRedirect: true,
  images: {
    // Mobile-first audience: WebP only (broadly supported, fast to encode — AVIF's
    // first-encode of large frames is what stalled the dev optimizer), and cap the
    // generated widths to phone/tablet sizes so we never build 1920–3840 monsters.
    formats: ["image/webp"],
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75],
  },
};

export default nextConfig;
