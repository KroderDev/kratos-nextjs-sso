import { expect, test, type Page } from "@playwright/test";

import { generateTotpCode, readTotpSecretFromQrDataUrl } from "./totp";

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

async function enrollTotp(page: Page) {
  await page.goto("/dashboard/settings");
  const totpSection = page.getByRole("group", { name: "Two-factor authentication" });
  const qrSource = await totpSection.locator('img[alt="Authenticator setup QR code"]').getAttribute("src");
  const secret = readTotpSecretFromQrDataUrl(qrSource ?? "");

  await totpSection.locator('input[name="totp_code"]').fill(generateTotpCode(secret));
  await totpSection.locator('button[name="method"][value="totp"]').click();
  await expect(page.getByText("Your changes have been saved!")).toBeVisible();

  return secret;
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: /account/i }).click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function loginWithPassword(page: Page, email: string) {
  await page.goto("/self-service/login/browser");
  await page.locator('input[name="identifier"]').fill(email);
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
  await expect(page.getByRole("group", { name: "Profile" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Password" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Two-factor authentication" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Backup recovery codes" })).toBeVisible();
});

test("enrolls TOTP and renders the backup-code controls", async ({ page }) => {
  await registerIdentity(page, `totp-${Date.now()}@example.com`);
  await page.goto("/dashboard/settings");

  const totpSection = page.getByRole("group", { name: "Two-factor authentication" });
  const qrCode = totpSection.locator('img[alt="Authenticator setup QR code"]');
  await expect(qrCode).toBeVisible();

  const qrSource = await qrCode.getAttribute("src");
  const secret = readTotpSecretFromQrDataUrl(qrSource ?? "");
  await totpSection.locator('input[name="totp_code"]').fill(generateTotpCode(secret));
  await totpSection.locator('button[name="method"][value="totp"]').click();

  await expect(page.getByText("Your changes have been saved!")).toBeVisible();

  const recoverySection = page.getByRole("group", { name: "Backup recovery codes" });
  await recoverySection.locator('button[name="lookup_secret_regenerate"]').click();
  await expect(recoverySection.locator('[data-recovery-codes="true"]')).toBeVisible();
  await expect(recoverySection.locator('button[name="lookup_secret_confirm"]')).toBeVisible();
});

test("requires TOTP for a password login after enrollment", async ({ page }) => {
  const email = `totp-login-${Date.now()}@example.com`;
  await registerIdentity(page, email);
  const secret = await enrollTotp(page);
  await signOut(page);
  await loginWithPassword(page, email);
  await expect(page.locator('input[name="totp_code"]')).toBeVisible();
  await page.locator('input[name="totp_code"]').fill("000000");
  await page.locator('button[name="method"][value="totp"]').click();
  await expect(page.getByText(/invalid/i).first()).toBeVisible();
  await page.locator('input[name="totp_code"]').fill(generateTotpCode(secret));
  await page.locator('button[name="method"][value="totp"]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("uses a confirmed backup recovery code for login", async ({ page }) => {
  const email = `recovery-login-${Date.now()}@example.com`;
  await registerIdentity(page, email);
  await enrollTotp(page);

  const recoverySection = page.getByRole("group", { name: "Backup recovery codes" });
  await recoverySection.locator('button[name="lookup_secret_regenerate"]').click();
  const recoveryCode = (await recoverySection.locator("code").first().textContent())?.trim();
  expect(recoveryCode).toMatch(/^\S+$/);
  await recoverySection.locator('button[name="lookup_secret_confirm"]').click();

  await signOut(page);
  await loginWithPassword(page, email);
  await expect(page.locator('input[name="lookup_secret"]')).toBeVisible();
  await page.locator('input[name="lookup_secret"]').fill(recoveryCode ?? "");
  await page.locator('button[name="method"][value="lookup_secret"]').last().click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await signOut(page);
  await loginWithPassword(page, email);
  await page.locator('input[name="lookup_secret"]').fill(recoveryCode ?? "");
  await page.locator('button[name="method"][value="lookup_secret"]').last().click();
  await expect(page.getByText(/already been used/i)).toBeVisible();
});

test("disables TOTP and returns password login to AAL1", async ({ page }) => {
  const email = `totp-disable-${Date.now()}@example.com`;
  await registerIdentity(page, email);
  await enrollTotp(page);

  const totpSection = page.getByRole("group", { name: "Two-factor authentication" });
  await totpSection.locator('button[name="totp_unlink"]').click();
  await expect(page.getByText("Your changes have been saved!")).toBeVisible();

  await signOut(page);
  await loginWithPassword(page, email);
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("invalidates the Kratos session on logout", async ({ page }) => {
  await registerIdentity(page, `logout-${Date.now()}@example.com`);
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", { name: /account/i }).click();
  const logout = page.getByRole("menuitem", { name: /sign out/i });
  const logoutHref = await logout.getAttribute("href");
  expect(logoutHref).toMatch(/\/self-service\/logout(?:\?|\/)/);
  expect(new URL(logoutHref ?? "", page.url()).origin).toBe(new URL(page.url()).origin);
  await logout.click();

  await expect(page).toHaveURL(/\/$/);
  const sessionResponse = await page.request.get("/sessions/whoami");
  expect(sessionResponse.status()).toBe(401);
});
