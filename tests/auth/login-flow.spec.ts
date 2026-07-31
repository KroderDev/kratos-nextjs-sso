import { expect, test } from "@playwright/test";

test("loads a browser login flow with the browser cookie", async ({
  page,
  request,
}) => {
  await page.goto("/self-service/login/browser");

  await expect(page).toHaveURL(/\/auth\/login\?flow=e2e-login-flow$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  const mockRequests = await request.get("http://127.0.0.1:4010/__e2e/requests");
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
