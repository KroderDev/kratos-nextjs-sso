import { expect, test } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("A calmer way to enter the work");
});

test("sign-in page shows Ory setup state when unconfigured", async ({ page }) => {
  const response = await page.goto("/auth/login");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Welcome back")).toBeVisible();
  await expect(page.getByText("Connect the identity service")).toBeVisible();
});

test("registration page shows Ory setup state when unconfigured", async ({ page }) => {
  const response = await page.goto("/auth/registration");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Make room for what is next")).toBeVisible();
  await expect(page.getByText("Connect the identity service")).toBeVisible();
});

test("recovery page shows Ory setup state when unconfigured", async ({ page }) => {
  const response = await page.goto("/auth/recovery");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Let's get you back in")).toBeVisible();
  await expect(page.getByText("Connect the identity service")).toBeVisible();
});

test("verification page shows Ory setup state when unconfigured", async ({ page }) => {
  const response = await page.goto("/auth/verification");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("One last clear signal")).toBeVisible();
  await expect(page.getByText("Connect the identity service")).toBeVisible();
});

test("dashboard shows setup state when Ory is unconfigured", async ({ page }) => {
  const response = await page.goto("/dashboard");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Your control room is waiting")).toBeVisible();
  await expect(page.getByText("Connect the identity service")).toBeVisible();
});

test("error page loads", async ({ page }) => {
  const response = await page.goto("/auth/error");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("That path closed early")).toBeVisible();
});
