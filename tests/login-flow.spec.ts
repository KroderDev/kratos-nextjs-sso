import { expect, test } from "@playwright/test";

test("login page does not retry flow requests when authentication is unavailable", async ({
  page,
}) => {
  const flowRequests: string[] = [];

  page.on("request", (request) => {
    if (request.url().includes("/self-service/login/flows")) {
      flowRequests.push(request.url());
    }
  });

  const response = await page.goto("/login");

  expect(response?.status()).toBe(200);
  await expect(page.getByText("Access is temporarily unavailable")).toBeVisible();
  expect(flowRequests).toHaveLength(0);
});
