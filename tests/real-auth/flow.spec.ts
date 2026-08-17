import { expect, test, type Page, type Request } from "@playwright/test";

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
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(/session active/i)).toBeVisible();
}

async function enrollTotp(page: Page) {
  await page.goto("/dashboard/settings?section=security");
  await expect(page.getByRole("heading", { name: "Security" })).toBeVisible();
  const totpSection = page.getByRole("group", { name: "Authenticator app" });
  const qrSource = await totpSection.locator('img[alt="Authenticator setup QR code"]').getAttribute("src");
  const secret = readTotpSecretFromQrDataUrl(qrSource ?? "");

  await totpSection.locator('input[name="totp_code"]').fill(generateTotpCode(secret));
  await totpSection.locator('button[name="method"][value="totp"]').click();
  await expect(page.getByText("Your changes have been saved!")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/settings/);
  expect(new URL(page.url()).searchParams.get("section")).toBe("security");

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

test("preserves a deep-linked settings area through the login redirect", async ({ page }) => {
  await page.goto("/dashboard/settings?section=security&lang=es");
  await expect(page).toHaveURL(/\/auth\/login/);

  const url = new URL(page.url());
  const returnTo = url.searchParams.get("return_to");
  const settingsCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "kratos_settings_area",
  );

  expect(url.pathname).toBe("/login");
  expect(returnTo).not.toBeNull();
  expect(returnTo).toContain("/dashboard/settings");
  expect(settingsCookie?.value).toBe("security");
});

test("renders settings for an authenticated identity", async ({ page }) => {
  const email = `settings-${Date.now()}@example.com`;

  await registerIdentity(page, email);

  await page.goto("/dashboard/settings");
  await expect(page.getByRole("heading", { name: "Keep your identity current." })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/dashboard/settings");
  const flowId = new URL(page.url()).searchParams.get("flow");
  expect(flowId).toMatch(/^[0-9a-f-]+$/i);
  await expect(page.getByRole("group", { name: "Profile" })).toBeVisible();

  const securityControl = page.getByRole("link", { name: "Security", exact: true }).first();

  const areaSwitchRequests: string[] = [];
  const documentRequests: string[] = [];
  const recordAreaSwitchRequest = (request: Request) => {
    if (request.resourceType() === "document") {
      documentRequests.push(request.url());
    }
    if (request.url().includes("/self-service/settings")) {
      areaSwitchRequests.push(request.url());
    }
  };
  page.on("request", recordAreaSwitchRequest);
  await securityControl.click();
  await expect(page).toHaveURL(/\/dashboard\/settings\?.*section=security/);
  await expect(page.getByRole("heading", { name: "Security" })).toBeVisible();
  page.off("request", recordAreaSwitchRequest);
  expect(documentRequests).toEqual([]);
  expect(areaSwitchRequests).toEqual([]);
  await expect(page.getByRole("status", { name: "Loading dashboard" })).toHaveCount(0);
  await expect(page.getByRole("status", { name: "Loading next page" })).toHaveAttribute(
    "aria-busy",
    "false",
  );

  await expect(page.getByRole("group", { name: "Password" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Authenticator app" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Backup recovery codes" })).toBeVisible();
});

test("enrolls TOTP and renders the backup-code controls", async ({ page }) => {
  await registerIdentity(page, `totp-${Date.now()}@example.com`);
  await page.goto("/dashboard/settings?section=security");
  await expect(page.getByRole("heading", { name: "Security" })).toBeVisible();

  const totpSection = page.getByRole("group", { name: "Authenticator app" });
  const qrCode = totpSection.locator('img[alt="Authenticator setup QR code"]');
  await expect(qrCode).toBeVisible();

  const qrSource = await qrCode.getAttribute("src");
  const secret = readTotpSecretFromQrDataUrl(qrSource ?? "");
  await totpSection.locator('input[name="totp_code"]').fill(generateTotpCode(secret));
  await totpSection.locator('button[name="method"][value="totp"]').click();

  await expect(page.getByText("Your changes have been saved!")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Your changes have been saved!")).toHaveCount(0);

  const recoverySection = page.getByRole("group", { name: "Backup recovery codes" });
  await recoverySection.locator('button[name="lookup_secret_regenerate"]').click();
  const recoveryCodes = page.locator('[data-recovery-codes="true"]');
  await expect(recoveryCodes).toBeVisible();
  await expect(recoverySection.locator('button[name="lookup_secret_confirm"]')).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
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
  const recoveryCode = (await page.locator('[data-recovery-codes="true"] code').first().textContent())?.trim();
  expect(recoveryCode).toMatch(/^\S+$/);
  await recoverySection.locator('button[name="lookup_secret_confirm"]').click();
  await expect(page.getByText("Your changes have been saved!")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/settings/);
  expect(new URL(page.url()).searchParams.get("section")).toBe("security");

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

test("updates profile settings without leaving the profile area", async ({ page }) => {
  await registerIdentity(page, `profile-${Date.now()}@example.com`);
  await page.goto("/dashboard/settings?section=profile");
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

  const profileSection = page.getByRole("group", { name: "Profile" });
  const firstName = profileSection.locator('input[name="traits.name.first"]');

  if (await firstName.count()) {
    await firstName.fill("Updated");
    await profileSection.locator('input[name="traits.name.last"]').fill("Profile");
  }

  await profileSection.locator('button[name="method"][value="profile"]').click();
  await expect(page).toHaveURL(/\/dashboard\/settings\/?.*section=profile/);
  await expect(page.getByText("Your changes have been saved!")).toBeVisible();
});

test("updates the password through the isolated password card", async ({ page }) => {
  await registerIdentity(page, `credential-update-${Date.now()}@example.com`);
  await page.goto("/dashboard/settings?section=security");
  await expect(page.getByRole("heading", { name: "Security" })).toBeVisible();

  const passwordSection = page.getByRole("group", { name: "Password" });
  await passwordSection.locator('input[name="password"]').fill("ci-password-updated-123");
  await passwordSection.locator('button[name="method"][value="password"]').click();
  await expect(page).toHaveURL(/\/dashboard\/settings\/?.*section=security/);
  await expect(page.getByText("Your changes have been saved!")).toBeVisible();
});

test("keeps recovery-code utility buttons out of the settings submission flow", async ({ page }) => {
  await registerIdentity(page, `recovery-controls-${Date.now()}@example.com`);
  await enrollTotp(page);

  const recoverySection = page.getByRole("group", { name: "Backup recovery codes" });
  await recoverySection.locator('button[name="lookup_secret_regenerate"]').click();
  const recoveryCodes = page.locator('[data-recovery-codes="true"]');
  await expect(recoveryCodes).toBeVisible();

  const settingsPosts: string[] = [];
  const recordSettingsPost = (request: Request) => {
    if (request.method() === "POST" && request.url().includes("/self-service/settings")) {
      settingsPosts.push(request.url());
    }
  };
  page.on("request", recordSettingsPost);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

  await recoveryCodes.getByRole("button", { name: "Copy all codes" }).click();
  await expect(recoveryCodes.locator('[aria-live="polite"]')).toHaveText("Copied");
  await recoveryCodes.getByRole("button", { name: "Download" }).click();
  await expect(recoveryCodes.getByRole("button", { name: "Downloaded" })).toBeVisible();

  page.off("request", recordSettingsPost);
  expect(settingsPosts).toEqual([]);
});

test("disables TOTP and returns password login to AAL1", async ({ page }) => {
  const email = `totp-disable-${Date.now()}@example.com`;
  await registerIdentity(page, email);
  await enrollTotp(page);

  const totpSection = page.getByRole("group", { name: "Authenticator app" });
  await totpSection.locator('[data-ory-destructive-trigger="totp_unlink"]').click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);

  await totpSection.locator('[data-ory-destructive-trigger="totp_unlink"]').click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).toHaveCount(0);

  await totpSection.locator('[data-ory-destructive-trigger="totp_unlink"]').click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  const settingsRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" && request.url().includes("/self-service/settings"),
  );
  await page.getByRole("alertdialog").getByRole("button", { name: "Turn off authentication" }).click();
  await settingsRequest;
  await expect(page.getByText("Your changes have been saved!")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/settings/);
  expect(new URL(page.url()).searchParams.get("section")).toBe("security");

  await signOut(page);
  await loginWithPassword(page, email);
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("links and unlinks a configured OIDC account", async ({ page }) => {
  await registerIdentity(page, `oidc-${Date.now()}@example.com`);
  await page.goto("/dashboard/settings?section=connections");
  await expect(page.getByRole("heading", { name: "Connected accounts" })).toBeVisible();

  let connections = page.getByRole("group", { name: "Connected accounts" });
  await expect(connections).toBeVisible();
  const linkRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" && request.url().includes("/self-service/settings"),
  );
  await connections.locator('button[name="link"]').click();
  await linkRequest;
  await expect(page).toHaveURL(/\/dashboard\/settings\/?.*section=connections/);
  await expect(page.getByText("Your changes have been saved!")).toBeVisible();

  connections = page.getByRole("group", { name: "Connected accounts" });
  await expect(connections.locator('button[name="unlink"]')).toBeVisible();
  const settingsRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" && request.url().includes("/self-service/settings"),
  );
  await connections.locator('button[name="unlink"]').click();
  await settingsRequest;
  await expect(page).toHaveURL(/\/dashboard\/settings\/?.*section=connections/);
  await expect(page.getByText("Your changes have been saved!")).toBeVisible();
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
