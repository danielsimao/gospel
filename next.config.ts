import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  compiler: {
    // Compile-time kill switches for Sentry's tracing/debug code paths.
    // Sentry's own excludeTracing define is webpack-only; this is the
    // Turbopack-compatible equivalent (see @sentry/nextjs config/webpack.js).
    // Values are JSON.stringify'd into the bundle; empty string is the
    // falsy literal ("false" would be a truthy string and defeat the switch).
    define: {
      __SENTRY_TRACING__: "",
      __SENTRY_DEBUG__: "",
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  disableLogger: true,
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
  },
});
