import type { NextConfig } from "next";

// ── Content Security Policy ───────────────────────────────────────────────────
// Shipped Report-Only first (verified via preview deploy), then promoted to
// enforced once confirmed clean — this project's remote-origin surface is
// small and fully enumerable (Supabase, Botpress, Vercel Insights), so unlike
// backyard-pos's CSP (which stays Report-Only long-term), this one should
// reach enforcement quickly.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'none'", // zero forms on this page
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
  // Next.js inline bootstrap + Botpress webchat injector
  "script-src 'self' 'unsafe-inline' https://cdn.botpress.cloud https://files.bpcontent.cloud",
  // React style={} props are inline; Botpress webchat injects its own
  // Google Fonts stylesheet (Inter) at runtime
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // next/font self-hosts ours, but Botpress's injected stylesheet pulls
  // its Inter font files from fonts.gstatic.com
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.botpress.cloud",
  "frame-src https://*.botpress.cloud",
  // Supabase REST + realtime, Botpress webchat, Vercel analytics beacon
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.botpress.cloud wss://*.botpress.cloud https://files.bpcontent.cloud https://*.vercel-insights.com https://vitals.vercel-insights.com",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" }, // nothing frames this page
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Match backyard-pos's initial max-age; raise once confident. Do NOT add
  // includeSubDomains/preload — byp./pos. share the theserverprojectph.cc
  // apex and a preload directive here could have apex-wide consequences.
  { key: "Strict-Transport-Security", value: "max-age=86400" },
  { key: "Content-Security-Policy-Report-Only", value: CSP },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
