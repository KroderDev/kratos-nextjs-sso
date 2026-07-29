import { expect, test } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("A calmer way to enter the work");
  await expect(page.getByRole("link", { name: "CI" })).toBeVisible();
});

test("theme control switches between light and dark", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Change color theme" }).click();
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("menuitemradio", { name: "Light" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("sign-in page shows setup state when unconfigured", async ({ page }) => {
  const response = await page.goto("/auth/login");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Welcome back")).toBeVisible();
  await expect(page.getByText("Access is temporarily unavailable")).toBeVisible();
});

test("registration page shows setup state when unconfigured", async ({ page }) => {
  const response = await page.goto("/auth/registration");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Make room for what is next")).toBeVisible();
  await expect(page.getByText("Access is temporarily unavailable")).toBeVisible();
});

test("recovery page shows setup state when unconfigured", async ({ page }) => {
  const response = await page.goto("/auth/recovery");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Let's get you back in")).toBeVisible();
  await expect(page.getByText("Access is temporarily unavailable")).toBeVisible();
});

test("verification page shows setup state when unconfigured", async ({ page }) => {
  const response = await page.goto("/auth/verification");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("One last clear signal")).toBeVisible();
  await expect(page.getByText("Access is temporarily unavailable")).toBeVisible();
});

test("dashboard shows setup state when the service is unconfigured", async ({ page }) => {
  const response = await page.goto("/dashboard");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Your control room is waiting")).toBeVisible();
  await expect(page.getByText("Access is temporarily unavailable")).toBeVisible();
});

test("error page loads", async ({ page }) => {
  const response = await page.goto("/auth/error");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("That path closed early")).toBeVisible();
});

test("health endpoint returns healthy", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: "healthy" });
});
