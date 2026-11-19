import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 4010);
const appPort = Number(process.env.APP_PORT ?? 3002);
const flowId = "e2e-login-flow";
const registrationDisabled = process.env.MOCK_KRATOS_REGISTRATION === "disabled";
const socialOnly = process.env.MOCK_KRATOS_SOCIAL_ONLY === "true";
const requests = [];
const logoutEvents = [];
const logoutState = {
  sessionMode: "inactive",
  keepSessionOnLogout: false,
  adapterFinalized: false,
  transaction: "e2e-logout-txn-1",
  csrf: "e2e-logout-csrf-1",
};

function resetLogoutState() {
  logoutEvents.length = 0;
  logoutState.sessionMode = "inactive";
  logoutState.keepSessionOnLogout = false;
  logoutState.adapterFinalized = false;
  logoutState.transaction = "e2e-logout-txn-1";
  logoutState.csrf = "e2e-logout-csrf-1";
}

function readRequestBody(request) {
  return new Promise((resolve) => {
    let body = "";
    if (typeof request.on !== "function") {
      resolve("");
      return;
    }
    request.on("data", (chunk) => {
      body += chunk.toString();
    });
    request.on("end", () => {
      resolve(body);
    });
  });
}

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

  if (url.pathname === "/__e2e/logout-state") {
    resetLogoutState();
    const session = url.searchParams.get("session");
    if (session === "active" || session === "inactive" || session === "error") {
      logoutState.sessionMode = session;
    }
    logoutState.keepSessionOnLogout =
      url.searchParams.get("keep_session_on_logout") === "true";
    const transaction = url.searchParams.get("transaction");
    const csrf = url.searchParams.get("csrf");
    if (transaction) {
      logoutState.transaction = transaction;
    }
    if (csrf) {
      logoutState.csrf = csrf;
    }
    response.writeHead(204);
    response.end();
    return;
  }

  if (url.pathname === "/__e2e/logout-events") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(logoutEvents));
    return;
  }

  if (url.pathname === "/sessions/whoami") {
    const cookie = request.headers.cookie ?? null;
    logoutEvents.push({
      kind: "whoami",
      method: request.method ?? "GET",
      cookie,
    });

    if (logoutState.sessionMode === "error") {
      response.writeHead(500, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          error: { code: 500, status: "Internal Server Error" },
        }),
      );
      return;
    }

    if (
      logoutState.sessionMode === "active" &&
      cookie?.includes("ory_kratos_session=e2e-active-session")
    ) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          id: "e2e-session-1",
          active: true,
          identity: {
            id: "e2e-identity-1",
            traits: { email: "demo@example.test" },
          },
        }),
      );
      return;
    }

    response.writeHead(401, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        error: {
          code: 401,
          id: "session_inactive",
          status: "Unauthorized",
        },
      }),
    );
    return;
  }

  if (url.pathname === "/self-service/logout/browser") {
    const cookie = request.headers.cookie ?? null;
    const returnTo = url.searchParams.get("return_to");
    logoutEvents.push({
      kind: "logout_flow",
      method: request.method ?? "GET",
      cookie,
      returnTo,
    });

    if (
      logoutState.sessionMode !== "active" ||
      !cookie?.includes("ory_kratos_session=e2e-active-session")
    ) {
      response.writeHead(401, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          error: {
            code: 401,
            id: "session_inactive",
            status: "Unauthorized",
          },
        }),
      );
      return;
    }

    const logoutUrl = new URL("/self-service/logout", `http://127.0.0.1:${port}`);
    logoutUrl.searchParams.set("token", "e2e-logout-token");
    if (returnTo) {
      logoutUrl.searchParams.set("return_to", returnTo);
    }

    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        logout_url: logoutUrl.toString(),
        logout_token: "e2e-logout-token",
      }),
    );
    return;
  }

  if (url.pathname === "/self-service/logout") {
    const token = url.searchParams.get("token");
    const returnTo = url.searchParams.get("return_to");
    logoutEvents.push({
      kind: "kratos_logout",
      method: request.method ?? "GET",
      token,
      returnTo,
      referer: request.headers.referer ?? null,
      cookie: request.headers.cookie ?? null,
    });

    if (token !== "e2e-logout-token" || !returnTo) {
      response.writeHead(400, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { code: 400 } }));
      return;
    }

    const headers = { location: returnTo };
    if (!logoutState.keepSessionOnLogout) {
      logoutState.sessionMode = "inactive";
      headers["set-cookie"] =
        "ory_kratos_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax";
    }

    response.writeHead(303, headers);
    response.end();
    return;
  }

  if (url.pathname === "/logout" && (request.method ?? "GET") === "GET") {
    const challenge = url.searchParams.get("logout_challenge");
    logoutEvents.push({
      kind: "provider_logout_get",
      method: "GET",
      challenge,
      referer: request.headers.referer ?? null,
      cookie: request.headers.cookie ?? null,
    });

    if (!challenge) {
      response.writeHead(400, { "content-type": "text/plain" });
      response.end("missing logout_challenge");
      return;
    }

    const handoff = new URL("/logout", `http://127.0.0.1:${appPort}`);
    handoff.searchParams.set("flow", "logout");
    handoff.searchParams.set("transaction", logoutState.transaction);
    handoff.searchParams.set("csrf", logoutState.csrf);
    handoff.searchParams.set("return_to", `http://127.0.0.1:${port}/logout`);

    response.writeHead(302, {
      location: handoff.toString(),
      "set-cookie":
        "provider_logout_adapter=e2e-adapter-cookie; Path=/; HttpOnly; SameSite=Lax",
    });
    response.end();
    return;
  }

  if (url.pathname === "/logout" && request.method === "POST") {
    readRequestBody(request).then((rawBody) => {
      const form = Object.fromEntries(new URLSearchParams(rawBody));
      const origin = request.headers.origin ?? null;
      const referer = request.headers.referer ?? null;
      const cookie = request.headers.cookie ?? null;

      logoutEvents.push({
        kind: "provider_logout_post",
        method: "POST",
        origin,
        referer,
        cookie,
        contentType: request.headers["content-type"] ?? null,
        form,
      });

      const expectedOrigin = `http://127.0.0.1:${appPort}`;
      if (
        origin !== expectedOrigin ||
        !cookie?.includes("provider_logout_adapter=e2e-adapter-cookie") ||
        form.transaction !== logoutState.transaction ||
        form.csrf !== logoutState.csrf ||
        logoutState.adapterFinalized
      ) {
        response.writeHead(403, { "content-type": "text/plain" });
        response.end("invalid logout finalization");
        return;
      }

      logoutState.adapterFinalized = true;
      response.writeHead(303, {
        location: `http://127.0.0.1:${port}/post-logout-done`,
      });
      response.end();
    });
    return;
  }

  if (url.pathname === "/post-logout-done") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end("<!doctype html><html><body><h1>Provider logout finalized</h1></body></html>");
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
    const location = new URL(
      "/login",
      `http://127.0.0.1:${port}`,
    );
    location.searchParams.set("flow", flowId);

    const returnTo = url.searchParams.get("return_to");
    if (returnTo) {
      location.searchParams.set("return_to", returnTo);
    }

    response.writeHead(303, {
      location: `${location.pathname}${location.search}`,
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
