import { expect, test } from "@playwright/test";

test("sets browser security headers", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();

  const contentSecurityPolicy = headers["content-security-policy"];

  expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
  expect(contentSecurityPolicy).toContain("style-src 'self' 'unsafe-inline'");
  expect(contentSecurityPolicy).not.toContain("unsafe-eval");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");

  const permissionsPolicy = headers["permissions-policy"];
  expect(permissionsPolicy).toBeDefined();
  for (const directive of [
    "accelerometer=()",
    "camera=()",
    "geolocation=()",
    "gyroscope=()",
    "magnetometer=()",
    "microphone=()",
    "payment=()",
    "usb=()",
  ]) {
    expect(permissionsPolicy).toContain(directive);
  }
});

test("does not expose server credentials in the public response", async ({ request }) => {
  const response = await request.get("/");
  const body = await response.text();

  expect(body).not.toContain("ORY_PROJECT_API_TOKEN");
  expect(body).not.toContain("ory_pat_");
});

test("unconfigured dashboard does not accept external navigation input", async ({ page }) => {
  await page.goto("/dashboard?return_to=https%3A%2F%2Fattacker.example%2F");
  await expect(page).toHaveURL(/127\.0\.0\.1|localhost/);
});

test("auth and dashboard pages forbid caching", async ({ request }) => {
  const sensitivePaths = [
    "/auth/login",
    "/auth/registration",
    "/auth/recovery",
    "/auth/verification",
    "/auth/error",
    "/dashboard",
    "/dashboard/settings",
  ];

  for (const path of sensitivePaths) {
    const response = await request.get(path, { maxRedirects: 0 });
    const cacheControl = response.headers()["cache-control"] ?? "";
    expect(
      cacheControl,
      `${path} must include no-store to prevent auth flow data from being cached`,
    ).toContain("no-store");
  }
});

test("CSP form-action directive is present and restricted", async ({ request }) => {
  const response = await request.get("/");
  const csp = response.headers()["content-security-policy"] ?? "";

  expect(csp, "form-action directive must be present").toContain("form-action");
  expect(csp, "form-action must not contain open wildcard").not.toMatch(
    /form-action\s+\*\b/,
  );
  expect(csp, "form-action must not contain '*'").not.toContain("form-action '*'");

  const formActionMatch = csp.match(/form-action\s+([^;]+)/);
  expect(formActionMatch, "must extract form-action source list").not.toBeNull();
  const formActionSources = formActionMatch![1].trim();

  expect(formActionSources, "must include 'self'").toContain("'self'");
  expect(
    formActionSources,
    "must not allow generic https: (would permit any HTTPS origin)",
  ).not.toMatch(/\bhttps:\b(?!\/\/)/);
  expect(formActionSources, "must not contain wildcard").not.toContain("*");
});

test("proxy routes return clean responses when the service is unconfigured", async ({
  request,
}) => {
  const proxyPaths = [
    "/self-service/login/browser",
    "/self-service/registration/browser",
    "/self-service/recovery/browser",
    "/self-service/verification/browser",
    "/sessions/whoami",
    "/.well-known/ory/webauthn.js",
    "/.ory/api/kratos/public/self-service/login/browser",
  ];

  for (const path of proxyPaths) {
    const response = await request.get(path, { maxRedirects: 0 });
    const status = response.status();
    const body = await response.text();

    expect(status, `${path} must not return a server error`).toBeLessThan(500);
    expect(
      body,
      `${path} must not expose raw server error details`,
    ).not.toMatch(/Error:|at |node_modules|stack trace/i);
  }
});
