import { expect, test } from "@playwright/test";

test("sets browser security headers", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();

  const contentSecurityPolicy = headers["content-security-policy"];

  expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
  expect(contentSecurityPolicy).not.toContain("unsafe-eval");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
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
