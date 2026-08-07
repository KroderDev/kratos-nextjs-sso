import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 4010);
const flowId = "e2e-login-flow";
const registrationDisabled = process.env.MOCK_KRATOS_REGISTRATION === "disabled";
const socialOnly = process.env.MOCK_KRATOS_SOCIAL_ONLY === "true";
const requests = [];

const DEFAULT_NODES = socialOnly
  ? [
      {
        type: "input",
        group: "default",
        attributes: {
          name: "csrf_token",
          type: "hidden",
          required: true,
          value: "e2e-csrf-token",
          node_type: "input",
        },
        messages: [],
        meta: {},
      },
      {
        type: "input",
        group: "oidc",
        attributes: {
          name: "provider",
          type: "submit",
          value: "google-provider",
          node_type: "input",
          label: { id: 1, text: "Sign in with Google", type: "info" },
        },
        messages: [],
        meta: {},
      },
      {
        type: "input",
        group: "oidc",
        attributes: {
          name: "provider",
          type: "submit",
          value: "github-provider",
          node_type: "input",
          label: { id: 2, text: "Sign in with GitHub", type: "info" },
        },
        messages: [],
        meta: {},
      },
    ]
  : [];

const flow = {
  id: flowId,
  type: "browser",
  issued_at: new Date().toISOString(),
  request_url: `http://127.0.0.1:${port}/self-service/login/browser`,
  ui: {
    action: `http://127.0.0.1:${port}/self-service/login`,
    method: "POST",
    nodes: DEFAULT_NODES,
    messages: [],
  },
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  requests.push({
    cookie: request.headers.cookie ?? null,
    host: request.headers.host ?? null,
    path: url.pathname,
    userAgent: request.headers["user-agent"] ?? null,
  });

  if (url.pathname === "/__e2e/requests") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(requests));
    return;
  }

  if (url.pathname === "/__e2e/reset") {
    requests.length = 0;
    response.writeHead(204);
    response.end();
    return;
  }

  if (
    url.pathname === "/self-service/registration/browser" &&
    registrationDisabled
  ) {
    response.writeHead(400, { "content-type": "application/json" });
    response.end(
      JSON.stringify({ error: { id: "self_service_flow_disabled" } }),
    );
    return;
  }

  if (url.pathname === "/self-service/login/browser") {
    response.writeHead(303, {
      location: `/auth/login?flow=${flowId}`,
      "set-cookie": "csrf_token=e2e-flow-cookie; Path=/; HttpOnly",
    });
    response.end();
    return;
  }

  if (url.pathname === "/self-service/login/flows") {
    const hasFlowCookie = request.headers.cookie?.includes(
      "csrf_token=e2e-flow-cookie",
    );

    if (!hasFlowCookie || url.searchParams.get("id") !== flowId) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { id: "security_csrf_violation" } }));
      return;
    }

    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(flow));
    return;
  }

  response.writeHead(404);
  response.end();
});

server.listen(port, "127.0.0.1");
