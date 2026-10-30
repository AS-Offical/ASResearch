import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Private routes: never cached, never indexed, never leak the token through the referrer.
const privateHeaders = [
  { key: "Cache-Control", value: "private, no-store" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      { source: "/v/:path*", headers: privateHeaders },
      { source: "/vault", headers: privateHeaders },
      { source: "/vault/:path*", headers: privateHeaders },
    ];
  },
};

export default withNextIntl(nextConfig);
