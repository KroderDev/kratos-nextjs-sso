import { expect, test } from "@playwright/test";

const kratosBaseUrl = `http://127.0.0.1:${process.env.PLAYWRIGHT_KRATOS_PORT ?? "4010"}`;

test("loads a browser login flow with the browser cookie", async ({
  page,
  request,
}) => {
  await request.post(`${kratosBaseUrl}/__e2e/reset`);
  await page.goto("/self-service/login/browser");

  await expect(page).toHaveURL(/\/auth\/login\?flow=e2e-login-flow$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  const mockRequests = await request.get(`${kratosBaseUrl}/__e2e/requests`);
  expect(mockRequests.ok()).toBe(true);
  const requests = (await mockRequests.json()) as Array<{
    cookie: string | null;
    path: string;
  }>;
  const flowRequests = requests.filter(
    ({ path }) => path === "/self-service/login/flows",
  );

  expect(flowRequests).toHaveLength(1);
  expect(flowRequests[0]?.cookie).toContain("csrf_token=e2e-flow-cookie");
});

test("hides password recovery link when no password login methods are available in the flow", async ({
  page,
  request,
}) => {
  await request.post(`${kratosBaseUrl}/__e2e/reset`);
  await page.goto("/self-service/login/browser");

  await expect(page.getByRole("link", { name: "Forgot your password?" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Create an account" })).toBeVisible();
});
