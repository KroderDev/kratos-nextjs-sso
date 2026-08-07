import { describe, expect, it, vi } from "vitest";

type MockRequest = { url: string; headers: Record<string, string> };
type MockResponseHandler = (request: MockRequest, response: MockResponse) => void;

interface MockResponse {
  writeHead(statusCode: number, headers?: Record<string, string>): void;
  end(chunk?: string): void;
}

const handlers: MockResponseHandler[] = [];

vi.mock("node:http", () => ({
  createServer: vi.fn((handler: MockResponseHandler) => {
    handlers.push(handler);
    return { listen: vi.fn() };
  }),
}));

function createExchange(url: string, headers: Record<string, string> = {}) {
  const request: MockRequest = { url, headers };
  let statusCode: number | undefined;
  let responseHeaders: Record<string, string> | undefined;
  let body = "";

  const response: MockResponse = {
    writeHead(code, hdrs) {
      statusCode = code;
      responseHeaders = hdrs;
    },
    end(chunk) {
      if (chunk) body += chunk;
    },
  };

  return {
    request,
    response,
    getStatus: () => statusCode,
    getHeaders: () => responseHeaders,
    getBody: () => body,
    getJson: () => JSON.parse(body || "null"),
  };
}

async function loadHandler(environment: Record<string, string> = {}) {
  vi.resetModules();
  handlers.length = 0;
  vi.unstubAllEnvs();
  for (const [name, value] of Object.entries(environment)) {
    vi.stubEnv(name, value);
  }
  await import("./mock-kratos.mjs");

  const handler = handlers.at(-1);
  if (!handler) {
    throw new Error("mock-kratos server handler was not registered");
  }

  return handler;
}

describe("mock-kratos e2e test server", () => {
  it("clears the request log and returns no content", async () => {
    const handler = await loadHandler();
    const request = createExchange("/self-service/login/browser");
    handler(request.request, request.response);

    const reset = createExchange("/__e2e/reset");
    handler(reset.request, reset.response);

    expect(reset.getStatus()).toBe(204);

    const introspection = createExchange("/__e2e/requests");
    handler(introspection.request, introspection.response);
    expect(introspection.getJson()).toEqual([
      { cookie: null, host: null, path: "/__e2e/requests", userAgent: null },
    ]);
  });

  it("returns the Kratos disabled-flow error when registration is disabled", async () => {
    const handler = await loadHandler({ MOCK_KRATOS_REGISTRATION: "disabled" });
    const exchange = createExchange("/self-service/registration/browser");

    handler(exchange.request, exchange.response);

    expect(exchange.getStatus()).toBe(400);
    expect(exchange.getHeaders()).toMatchObject({
      "content-type": "application/json",
    });
    expect(exchange.getJson()).toEqual({
      error: { id: "self_service_flow_disabled" },
    });
  });

  it("redirects a browser login flow request with the CSRF flow cookie", async () => {
    const handler = await loadHandler();
    const exchange = createExchange("/self-service/login/browser");

    handler(exchange.request, exchange.response);

    expect(exchange.getStatus()).toBe(303);
    expect(exchange.getHeaders()).toMatchObject({
      location: "/auth/login?flow=e2e-login-flow",
      "set-cookie": "csrf_token=e2e-flow-cookie; Path=/; HttpOnly",
    });
  });

  it("preserves nested return_to query parameters in the browser redirect", async () => {
    const handler = await loadHandler();
    const callbackUrl =
      "https://provider.example/login/callback?csrf=csrf-token&transaction=transaction-id&flow=login";
    const exchange = createExchange(
      `/self-service/login/browser?return_to=${encodeURIComponent(callbackUrl)}`,
    );

    handler(exchange.request, exchange.response);

    const location = new URL(
      exchange.getHeaders()?.location ?? "",
      "http://127.0.0.1:4010",
    );
    expect(location.searchParams.get("return_to")).toBe(callbackUrl);
  });

  it("returns the login flow JSON when the CSRF cookie and flow id both match", async () => {
    const handler = await loadHandler();
    const exchange = createExchange(
      "/self-service/login/flows?id=e2e-login-flow",
      { cookie: "csrf_token=e2e-flow-cookie" },
    );

    handler(exchange.request, exchange.response);

    expect(exchange.getStatus()).toBe(200);
    expect(exchange.getHeaders()).toMatchObject({
      "content-type": "application/json",
    });

    const flow = exchange.getJson();
    expect(flow.id).toBe("e2e-login-flow");
    expect(flow.type).toBe("browser");
    expect(flow.ui.action).toContain("/self-service/login");
    expect(flow.ui.method).toBe("POST");
  });

  it("rejects the flow lookup with 403 when the CSRF cookie is missing", async () => {
    const handler = await loadHandler();
    const exchange = createExchange("/self-service/login/flows?id=e2e-login-flow");

    handler(exchange.request, exchange.response);

    expect(exchange.getStatus()).toBe(403);
    expect(exchange.getJson()).toEqual({
      error: { id: "security_csrf_violation" },
    });
  });

  it("rejects the flow lookup with 403 when the cookie header does not contain the flow cookie", async () => {
    const handler = await loadHandler();
    const exchange = createExchange(
      "/self-service/login/flows?id=e2e-login-flow",
      { cookie: "session=unrelated" },
    );

    handler(exchange.request, exchange.response);

    expect(exchange.getStatus()).toBe(403);
  });

  it("rejects the flow lookup with 403 when the flow id query parameter does not match", async () => {
    const handler = await loadHandler();
    const exchange = createExchange(
      "/self-service/login/flows?id=some-other-flow",
      { cookie: "csrf_token=e2e-flow-cookie" },
    );

    handler(exchange.request, exchange.response);

    expect(exchange.getStatus()).toBe(403);
  });

  it("rejects the flow lookup with 403 when the flow id query parameter is missing", async () => {
    const handler = await loadHandler();
    const exchange = createExchange("/self-service/login/flows", {
      cookie: "csrf_token=e2e-flow-cookie",
    });

    handler(exchange.request, exchange.response);

    expect(exchange.getStatus()).toBe(403);
  });

  it("returns 404 with an empty body for unknown paths", async () => {
    const handler = await loadHandler();
    const exchange = createExchange("/unknown/path");

    handler(exchange.request, exchange.response);

    expect(exchange.getStatus()).toBe(404);
    expect(exchange.getBody()).toBe("");
  });

  it("records every incoming request, including the introspection request itself", async () => {
    const handler = await loadHandler();

    const browserRequest = createExchange("/self-service/login/browser", {
      host: "127.0.0.1:4010",
      "user-agent": "Playwright/1.0",
    });
    handler(browserRequest.request, browserRequest.response);

    const introspection = createExchange("/__e2e/requests");
    handler(introspection.request, introspection.response);

    expect(introspection.getStatus()).toBe(200);
    expect(introspection.getJson()).toEqual([
      {
        cookie: null,
        host: "127.0.0.1:4010",
        path: "/self-service/login/browser",
        userAgent: "Playwright/1.0",
      },
      {
        cookie: null,
        host: null,
        path: "/__e2e/requests",
        userAgent: null,
      },
    ]);
  });

  it("records the cookie sent on a flow lookup request", async () => {
    const handler = await loadHandler();

    const flowRequest = createExchange(
      "/self-service/login/flows?id=e2e-login-flow",
      { cookie: "csrf_token=e2e-flow-cookie" },
    );
    handler(flowRequest.request, flowRequest.response);

    const introspection = createExchange("/__e2e/requests");
    handler(introspection.request, introspection.response);

    const recorded = introspection.getJson() as Array<{ cookie: string | null }>;
    expect(recorded[0]?.cookie).toBe("csrf_token=e2e-flow-cookie");
  });

  it("starts a fresh, isolated request log for each loaded server instance", async () => {
    const firstHandler = await loadHandler();
    const firstExchange = createExchange("/self-service/login/browser");
    firstHandler(firstExchange.request, firstExchange.response);

    const secondHandler = await loadHandler();
    const introspection = createExchange("/__e2e/requests");
    secondHandler(introspection.request, introspection.response);

    expect(introspection.getJson()).toEqual([
      { cookie: null, host: null, path: "/__e2e/requests", userAgent: null },
    ]);
  });

  it("returns provider nodes when MOCK_KRATOS_SOCIAL_ONLY is set to true", async () => {
    const handler = await loadHandler({ MOCK_KRATOS_SOCIAL_ONLY: "true" });
    const exchange = createExchange(
      "/self-service/login/flows?id=e2e-login-flow",
      { cookie: "csrf_token=e2e-flow-cookie" },
    );

    handler(exchange.request, exchange.response);

    expect(exchange.getStatus()).toBe(200);
    const flow = exchange.getJson();

    expect(flow.ui.nodes).toHaveLength(3);
    const providers = flow.ui.nodes.filter(
      (node: Record<string, unknown>) =>
        node.group === "oidc",
    );
    expect(providers).toHaveLength(2);

    const google = providers.find(
      (node: Record<string, unknown>) =>
        (node.attributes as Record<string, unknown>)?.value === "google-provider",
    );
    expect(google).toBeDefined();

    const csrf = flow.ui.nodes.find(
      (node: Record<string, unknown>) =>
        node.group === "default",
    );
    expect(csrf).toBeDefined();
    expect((csrf?.attributes as Record<string, unknown>)?.name).toBe("csrf_token");
  });

  it("excludes password-group nodes from the social-only flow nodes", async () => {
    const handler = await loadHandler({ MOCK_KRATOS_SOCIAL_ONLY: "true" });
    const exchange = createExchange(
      "/self-service/login/flows?id=e2e-login-flow",
      { cookie: "csrf_token=e2e-flow-cookie" },
    );

    handler(exchange.request, exchange.response);

    const flow = exchange.getJson();
    const hasPasswordNode = flow.ui.nodes.some(
      (node: Record<string, unknown>) =>
        node.group === "password" || node.group === "code",
    );
    expect(hasPasswordNode).toBe(false);
  });
});
