import type { NextConfig } from "next";

import { getConfiguredOrigins, getFormActionSources } from "./lib/ory/csp";

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  devIndicators: { position: "bottom-left" },
  async headers() {
    const appOrigin = (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "");
      } catch {
        return undefined;
      }
    })();
    const sdkOrigin = (() => {
      try {
        return new URL(
          process.env.NEXT_PUBLIC_ORY_SDK_URL ?? process.env.ORY_SDK_URL ?? "",
        ).origin;
      } catch {
        return undefined;
      }
    })();
    const connectSources = ["'self'", sdkOrigin].filter(Boolean).join(" ");
    const scriptSources = ["'self'", sdkOrigin].filter(Boolean).join(" ");
    const oauthOrigins = getConfiguredOrigins(process.env.NEXT_PUBLIC_ORY_OAUTH_ORIGINS);
    const formActionOrigins = getConfiguredOrigins(
      process.env.NEXT_PUBLIC_ORY_FORM_ACTION_ORIGINS,
    );
    const formSources = getFormActionSources(
      sdkOrigin,
      oauthOrigins,
      formActionOrigins,
    );
    const developmentScriptSource =
      process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
    const securityHeaders = [
      { key: "Content-Security-Policy", value: [
        "default-src 'self'",
        `connect-src ${connectSources}`,
        `form-action ${formSources}`,
        // Next.js emits inline bootstrap scripts; keep the policy scoped to
        // this origin and the configured Ory origin until nonce support is added.
        `script-src ${scriptSources} 'unsafe-inline'${developmentScriptSource}`,
        "img-src 'self' data: https:",
        "style-src 'self' 'unsafe-inline'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
      ].join("; ") },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" },
    ];

    if (appOrigin?.protocol === "https:") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
