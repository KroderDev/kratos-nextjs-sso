import { expect, test } from "@playwright/test";

const kratosBaseUrl = `http://127.0.0.1:${process.env.PLAYWRIGHT_KRATOS_PORT ?? "4010"}`;

test.describe.configure({ mode: "serial" });

test("loads a browser login flow with the browser cookie", async ({
  page,
  request,
}) => {
  await request.post(`${kratosBaseUrl}/__e2e/reset`);
  await page.goto("/self-service/login/browser");

  await expect(page).toHaveURL(/\/login\?flow=e2e-login-flow$/);
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

test("adapts the provider login handoff before creating a Kratos flow", async ({
  page,
}) => {
  const callbackUrl = new URL(`${kratosBaseUrl}/login/callback`);
  const handoff = new URLSearchParams({
    flow: "login",
    transaction: "transaction-id",
    csrf: "csrf-token",
    return_to: callbackUrl.toString(),
  });

  await page.goto(`/login?${handoff.toString()}`);

  await expect(page).toHaveURL(/\/login\?flow=e2e-login-flow/);
  const returnTo = new URL(page.url()).searchParams.get("return_to");
  const decoded = decodeURIComponent(returnTo ?? "");
  expect(decoded).toContain("/login/continue");
  expect(decoded).toContain("transaction=transaction-id");
  expect(decoded).toContain("csrf=csrf-token");
});

test("preserves nested return_to query parameters through the UI redirect", async ({
  page,
}) => {
  const callbackUrl = new URL("https://provider.example/login/callback");
  callbackUrl.searchParams.set("csrf", "csrf-token");
  callbackUrl.searchParams.set("transaction", "transaction-id");
  callbackUrl.searchParams.set("flow", "login");

  await page.goto(
    `/self-service/login/browser?return_to=${encodeURIComponent(callbackUrl.toString())}`,
  );

  expect(new URL(page.url()).searchParams.get("return_to")).toBe(
    callbackUrl.toString(),
  );
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
