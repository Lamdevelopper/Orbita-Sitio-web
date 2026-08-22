import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers applied to all responses
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "img-src 'self' https: data: blob:",
            "style-src 'self' 'unsafe-inline' 'report-sample'",
            "script-src 'self' 'unsafe-inline' 'report-sample'",
            "font-src 'self'",
            "connect-src 'self'",
            "base-uri 'none'",
              "object-src 'none'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: "/:file(brand/.*|articles/.*|editions/.*|favicon.*|apple-touch-icon.*|og.(png|jpg)|llms.txt)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
