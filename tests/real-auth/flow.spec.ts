import { expect, test, type Page } from "@playwright/test";

async function registerIdentity(page: Page, email: string) {
  await page.goto("/self-service/registration/browser");
  await expect(page).toHaveURL(/\/auth\/registration\?flow=[0-9a-f-]+$/i);

  await page.locator('input[name="traits.email"]').fill(email);
  const firstName = page.locator('input[name="traits.name.first"]');
  if (await firstName.count()) {
    await firstName.fill("CI");
    await page.locator('input[name="traits.name.last"]').fill("Runner");
  }

  await page.locator('button[name="method"][value="profile"]').click();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await page.locator('input[name="password"]').fill("ci-password-123");
  await page.locator('button[name="method"][value="password"]').click();
}

test("renders a login flow from real Kratos", async ({ page }) => {
  const response = await page.goto("/self-service/login/browser");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/auth\/login\?flow=[0-9a-f-]+$/i);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.locator('input[name="identifier"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(page.locator('input[name="csrf_token"]')).toHaveCount(1);

  const formAction = await page.locator("form").getAttribute("action");
  expect(new URL(formAction ?? "", page.url()).origin).toBe(new URL(page.url()).origin);

  const cookies = await page.context().cookies();
  expect(cookies.some(({ name, domain }) => name.includes("csrf") && domain === "127.0.0.1")).toBe(
    true,
  );
});

test("registers an identity and loads the authenticated dashboard", async ({ page }) => {
  const email = `ci-${Date.now()}@example.com`;

  await registerIdentity(page, email);

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText(/session active/i)).toBeVisible();
});

test("renders settings for an authenticated identity", async ({ page }) => {
  const email = `settings-${Date.now()}@example.com`;

  await registerIdentity(page, email);

  await page.goto("/dashboard/settings");
  expect(new URL(page.url()).pathname).toBe("/dashboard/settings");
  await expect(page.getByRole("heading", { name: "Keep your identity current." })).toBeVisible();
  await expect(page.locator('form[action*="/self-service/settings"]')).toBeVisible();
});

test("invalidates the Kratos session on logout", async ({ page }) => {
  await registerIdentity(page, `logout-${Date.now()}@example.com`);
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", { name: /account/i }).click();
  const signOut = page.getByRole("menuitem", { name: /sign out/i });
  const logoutHref = await signOut.getAttribute("href");
  expect(logoutHref).toMatch(/\/self-service\/logout(?:\?|\/)/);
  expect(new URL(logoutHref ?? "", page.url()).origin).toBe(new URL(page.url()).origin);
  await signOut.click();

  await expect(page).toHaveURL(/\/$/);
  const sessionResponse = await page.request.get("/sessions/whoami");
  expect(sessionResponse.status()).toBe(401);
});
