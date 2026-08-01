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

test("shadcn semantic theme tokens switch between light and dark", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Change color theme" }).click();
  await page.getByRole("menuitemradio", { name: "Light" }).click();

  const lightTokens = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);

    return {
      background: styles.getPropertyValue("--background").trim(),
      foreground: styles.getPropertyValue("--foreground").trim(),
      primary: styles.getPropertyValue("--primary").trim(),
    };
  });

  expect(lightTokens.background).not.toBe("");
  expect(lightTokens.foreground).not.toBe("");
  expect(lightTokens.primary).not.toBe("");

  await page.getByRole("menuitemradio", { name: "Dark" }).click();

  const darkTokens = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);

    return {
      background: styles.getPropertyValue("--background").trim(),
      foreground: styles.getPropertyValue("--foreground").trim(),
      primary: styles.getPropertyValue("--primary").trim(),
    };
  });

  expect(darkTokens.background).not.toBe("");
  expect(darkTokens.foreground).not.toBe("");
  expect(darkTokens.primary).not.toBe("");
  expect(darkTokens.background).not.toBe(lightTokens.background);
  expect(darkTokens.foreground).not.toBe(lightTokens.foreground);
  expect(darkTokens.primary).not.toBe(lightTokens.primary);
});

test("shadcn font token controls the page font", async ({ page }) => {
  await page.goto("/");

  const fontState = await page.evaluate(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const bodyStyles = getComputedStyle(document.body);

    return {
      token: rootStyles.getPropertyValue("--font-sans").trim(),
      bodyFont: bodyStyles.fontFamily,
    };
  });

  const primaryFont = fontState.token
    .split(",", 1)[0]
    .trim()
    .replace(/^['"]|['"]$/g, "");

  expect(primaryFont).not.toBe("");
  expect(fontState.bodyFont).toContain(primaryFont);
});

test("header actions share the same shadcn button height", async ({ page }) => {
  await page.goto("/");

  const actions = [
    page.getByRole("button", { name: "Change color theme" }),
    page.getByRole("link", { name: "Sign in", exact: true }),
    page.getByRole("link", { name: "Get started", exact: true }),
  ];
  const heights = await Promise.all(
    actions.map((action) => action.evaluate((element) => element.getBoundingClientRect().height)),
  );

  expect(new Set(heights).size).toBe(1);
});

test("navigation feedback appears before a route transition completes", async ({ page }) => {
  await page.goto("/");
  await page.route("**/auth/login**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });

  const navigation = page.getByRole("link", { name: "Sign in", exact: true }).click();

  const feedback = page.getByRole("status", { name: "Loading next page" });

  await expect(feedback).toHaveAttribute("aria-busy", "true");
  await expect(feedback.locator(".navigation-progress")).toBeVisible();
  await navigation;
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("status", { name: "Loading next page" })).toHaveAttribute(
    "aria-busy",
    "false",
  );
});

test("auth navigation shows the two-column loading frame", async ({ page }) => {
  await page.goto("/");
  await page.route("**/auth/login**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });

  const navigation = page.getByRole("link", { name: "Sign in", exact: true }).click();

  await expect(page.getByRole("complementary").first()).toBeVisible();
  await expect(page.getByRole("status", { name: "Loading authentication form" })).toBeVisible();
  await navigation;
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});


test("auth navigation keeps the frame while flow content loads", async ({ page }) => {
  await page.goto("/auth/login");
  await page.route("**/auth/registration**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });

  const navigation = page.getByRole("link", { name: "Create one", exact: true }).click();

  await expect(page.getByRole("complementary").first()).toBeVisible();
  await expect(page.getByText("Just a moment")).toHaveCount(0);
  await navigation;
  await expect(page.getByRole("heading", { name: "Make room for what is next" })).toBeVisible();
});

test("theme control is circular on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");

  const themeButton = page.getByRole("button", { name: "Change color theme" });
  const box = await themeButton.boundingBox();
  const iconBox = await themeButton.locator("svg").boundingBox();

  expect(box).not.toBeNull();
  expect(iconBox).not.toBeNull();
  expect(box?.width).toBe(box?.height);
  expect(Math.abs((box?.x ?? 0) + (box?.width ?? 0) / 2 - ((iconBox?.x ?? 0) + (iconBox?.width ?? 0) / 2))).toBeLessThan(1);
  expect(Math.abs((box?.y ?? 0) + (box?.height ?? 0) / 2 - ((iconBox?.y ?? 0) + (iconBox?.height ?? 0) / 2))).toBeLessThan(1);
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
  await expect(page.getByRole("heading", { name: "Make room for what is next" })).toBeVisible();
  await expect(page.getByText("Access is temporarily unavailable")).toBeVisible();
});

test("recovery page shows setup state when unconfigured", async ({ page }) => {
  const response = await page.goto("/auth/recovery");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Let's get you back in" })).toBeVisible();
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

test("settings uses the dashboard frame when the service is unconfigured", async ({ page }) => {
  const response = await page.goto("/dashboard/settings");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("link", { name: "Settings", exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Keep your identity current." }),
  ).toBeVisible();
  await expect(page.getByRole("complementary").first()).toBeVisible();
});

test("settings navigation skips the auth loading frame", async ({ page }) => {
  await page.route("**/dashboard/settings**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
  await page.goto("/dashboard");

  const navigation = page.getByRole("link", { name: "Settings", exact: true }).click();

  await expect(page.getByRole("status", { name: "Loading dashboard" })).toBeVisible();
  await expect(page.getByRole("status", { name: "Loading authentication form" })).toHaveCount(0);
  await navigation;
  await expect(page.getByText("Keep your identity current")).toBeVisible();
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
