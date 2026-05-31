import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// ═══════════════════════════════════════════════════════════════════════════════
// Content Security Policy — Protection XSS et injections
// ═══════════════════════════════════════════════════════════════════════════════
const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://clerk.calendapro.app https://challenges.cloudflare.com https://*.clerk.accounts.dev https://clerk.accounts.dev https://*.clerk.com;
  style-src 'self' 'unsafe-inline' https://api.fontshare.com https://cdn.fontshare.com https://fonts.googleapis.com;
  img-src 'self' blob: data: https://*.stripe.com https://clerk.calendapro.app https://img.clerk.com https://*.clerk.com https://*.gravatar.com;
  font-src 'self' https://api.fontshare.com https://cdn.fontshare.com https://fonts.gstatic.com;
  worker-src 'self' blob:;
  connect-src 'self' https://*.stripe.com https://*.supabase.co https://clerk.calendapro.app https://api.clerk.dev https://api.openai.com https://api.anthropic.com https://*.clerk.accounts.dev https://clerk.accounts.dev https://*.clerk.com https://clerk-telemetry.com;
  frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://connect.stripe.com https://challenges.cloudflare.com https://*.clerk.accounts.dev;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://*.stripe.com;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // Performance optimizations - Audit #7
  // ═══════════════════════════════════════════════════════════════════════════════
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    remotePatterns: [
      { protocol: 'https', hostname: '**.stripe.com' },
      { protocol: 'https', hostname: 'clerk.calendapro.app' },
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },

  // Experimental features for performance
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // Headers de sécurité + Cache — Audit #3 Sécurité + #7 Performance
  // ═══════════════════════════════════════════════════════════════════════════════
  async headers() {
    return [
      // Cache pour les assets statiques
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=3600',
          },
        ],
      },
      // Headers de sécurité pour toutes les routes
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: CSP_HEADER,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      // Widget embeddable — autorise l'affichage en iframe sur n'importe quel domaine
      {
        source: '/widget/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors *',
          },
        ],
      },
    ];
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Sentry — Error monitoring (wrap Next.js config)
// ═══════════════════════════════════════════════════════════════════════════════
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || undefined,
  project: process.env.SENTRY_PROJECT || undefined,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: true,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
  },
});