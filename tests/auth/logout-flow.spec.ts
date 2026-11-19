import { expect, test } from "@playwright/test";

const appPort = process.env.PLAYWRIGHT_APP_PORT ?? "3002";
const kratosPort = process.env.PLAYWRIGHT_KRATOS_PORT ?? "4010";
const appOrigin = `http://127.0.0.1:${appPort}`;
const providerOrigin = `http://127.0.0.1:${kratosPort}`;

type LogoutEvent = {
  kind: string;
  method: string;
  origin?: string | null;
  referer?: string | null;
  cookie?: string | null;
  returnTo?: string | null;
  challenge?: string | null;
  form?: Record<string, string>;
};

test.describe.configure({ mode: "serial" });

test("completes provider-mediated browser logout via /logout -> Kratos -> /logout/complete -> cross-origin POST", async ({
  context,
  page,
  request,
}) => {
  await request.post(`${providerOrigin}/__e2e/reset`);
  await request.post(
    `${providerOrigin}/__e2e/logout-state?session=active&transaction=txn-browser-1&csrf=csrf-browser-1`,
  );
  await context.addCookies([
    {
      name: "ory_kratos_session",
      value: "e2e-active-session",
      url: appOrigin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  await page.goto(`${providerOrigin}/logout?logout_challenge=demo-challenge-1`);

  await expect(page).toHaveURL(`${providerOrigin}/post-logout-done`);
  await expect(
    page.getByRole("heading", { name: "Provider logout finalized" }),
  ).toBeVisible();

  const eventsResponse = await request.get(`${providerOrigin}/__e2e/logout-events`);
  expect(eventsResponse.ok()).toBe(true);
  const events = (await eventsResponse.json()) as LogoutEvent[];

  const logoutFlowCalls = events.filter(({ kind }) => kind === "logout_flow");
  expect(logoutFlowCalls).toHaveLength(1);
  expect(logoutFlowCalls[0]?.returnTo).toBe(`${appOrigin}/logout/complete`);

  const kratosLogoutCalls = events.filter(({ kind }) => kind === "kratos_logout");
  expect(kratosLogoutCalls).toHaveLength(1);
  expect(kratosLogoutCalls[0]?.referer).toBeNull();

  // Never send a provider handoff back to /logout as a GET without logout_challenge.
  const providerGetCalls = events.filter(({ kind }) => kind === "provider_logout_get");
  expect(providerGetCalls).toHaveLength(1);
  expect(providerGetCalls[0]?.challenge).toBe("demo-challenge-1");

  const providerPostCalls = events.filter(({ kind }) => kind === "provider_logout_post");
  expect(providerPostCalls).toHaveLength(1);
  expect(providerPostCalls[0]).toMatchObject({
    method: "POST",
    origin: appOrigin,
    referer: `${appOrigin}/`,
    form: {
      transaction: "txn-browser-1",
      csrf: "csrf-browser-1",
    },
  });
  expect(providerPostCalls[0]?.cookie).toContain("provider_logout_adapter=e2e-adapter-cookie");
  expect(providerPostCalls[0]?.cookie).not.toContain("kratos_logout_handoff");
  expect(providerPostCalls[0]?.referer).not.toContain("txn-browser-1");
  expect(providerPostCalls[0]?.referer).not.toContain("csrf-browser-1");
  expect(providerPostCalls[0]?.referer).not.toContain("/logout/complete");

  // Continuation cookie is cleared and replaying /logout/complete fails closed.
  const cookiesAfter = await context.cookies(appOrigin);
  expect(cookiesAfter.some(({ name }) => name === "kratos_logout_handoff")).toBe(false);

  await page.goto(`${appOrigin}/logout/complete`);
  await expect(page).toHaveURL(`${appOrigin}/error?reason=invalid_request`);

  const afterReplayEvents = (await (
    await request.get(`${providerOrigin}/__e2e/logout-events`)
  ).json()) as LogoutEvent[];
  expect(
    afterReplayEvents.filter(({ kind }) => kind === "provider_logout_post"),
  ).toHaveLength(1);
});

test("finalizes provider logout via native cross-origin POST when Kratos session is already logged out", async ({
  page,
  request,
}) => {
  await request.post(`${providerOrigin}/__e2e/reset`);
  await request.post(
    `${providerOrigin}/__e2e/logout-state?session=inactive&transaction=txn-browser-2&csrf=csrf-browser-2`,
  );

  await page.goto(`${providerOrigin}/logout?logout_challenge=demo-challenge-2`);

  await expect(page).toHaveURL(`${providerOrigin}/post-logout-done`);
  await expect(
    page.getByRole("heading", { name: "Provider logout finalized" }),
  ).toBeVisible();

  const events = (await (
    await request.get(`${providerOrigin}/__e2e/logout-events`)
  ).json()) as LogoutEvent[];

  expect(events.filter(({ kind }) => kind === "logout_flow")).toHaveLength(0);
  const providerPostCalls = events.filter(({ kind }) => kind === "provider_logout_post");
  expect(providerPostCalls).toHaveLength(1);
  expect(providerPostCalls[0]).toMatchObject({
    method: "POST",
    origin: appOrigin,
    referer: `${appOrigin}/`,
    form: {
      transaction: "txn-browser-2",
      csrf: "csrf-browser-2",
    },
  });
});

test("refuses provider logout handoff when the Kratos session is not cleared", async ({
  context,
  page,
  request,
}) => {
  await request.post(`${providerOrigin}/__e2e/reset`);
  await request.post(
    `${providerOrigin}/__e2e/logout-state?session=active&keep_session_on_logout=true&transaction=txn-browser-3&csrf=csrf-browser-3`,
  );
  await context.addCookies([
    {
      name: "ory_kratos_session",
      value: "e2e-active-session",
      url: appOrigin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  await page.goto(`${providerOrigin}/logout?logout_challenge=demo-challenge-3`);

  await expect(page).toHaveURL(`${appOrigin}/error?reason=logout_unavailable`);

  const events = (await (
    await request.get(`${providerOrigin}/__e2e/logout-events`)
  ).json()) as LogoutEvent[];
  expect(events.filter(({ kind }) => kind === "provider_logout_post")).toHaveLength(0);
});

test("refuses provider logout handoff when Kratos whoami fails with 500", async ({
  page,
  request,
}) => {
  await request.post(`${providerOrigin}/__e2e/reset`);
  await request.post(
    `${providerOrigin}/__e2e/logout-state?session=error&transaction=txn-browser-4&csrf=csrf-browser-4`,
  );

  await page.goto(`${providerOrigin}/logout?logout_challenge=demo-challenge-4`);

  await expect(page).toHaveURL(`${appOrigin}/error?reason=logout_unavailable`);

  const events = (await (
    await request.get(`${providerOrigin}/__e2e/logout-events`)
  ).json()) as LogoutEvent[];
  expect(events.filter(({ kind }) => kind === "provider_logout_post")).toHaveLength(0);
});


test("resumes completion when the session is revoked before browser logout", async ({ context, page, request }) => {
  await request.post(`${providerOrigin}/__e2e/logout-state?session=active&transaction=txn-race&csrf=csrf-race`);
  await context.addCookies([{ name: "ory_kratos_session", value: "e2e-active-session", url: appOrigin }]);
  await page.route("**/self-service/logout?**", async (route) => {
    await request.post(`${providerOrigin}/__e2e/logout-state?session=inactive&transaction=txn-race&csrf=csrf-race`);
    await route.continue();
  });
  const paths: string[] = [];
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) paths.push(new URL(frame.url()).pathname);
  });
  await page.goto(`${providerOrigin}/logout?logout_challenge=race`);
  await expect(page).toHaveURL(`${providerOrigin}/post-logout-done`);
  expect(paths).toContain("/logout/complete");
  expect(paths).not.toContain("/error");
  const events = await (await request.get(`${providerOrigin}/__e2e/logout-events`)).json() as LogoutEvent[];
  expect(events.filter(({ kind }) => kind === "kratos_logout")).toHaveLength(1);
  expect(events.filter(({ kind }) => kind === "provider_logout_post")).toMatchObject([{
    form: { transaction: "txn-race", csrf: "csrf-race" },
  }]);
});
