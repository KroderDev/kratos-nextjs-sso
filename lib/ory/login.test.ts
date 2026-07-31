import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  incoming: new Headers(),
  request: undefined as
    | { id: string; cookie?: string; headers: Headers }
    | undefined,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => state.incoming),
}));

vi.mock("@ory/client-fetch", () => ({
  Configuration: class {
    constructor(public options: unknown) {}
  },
  FlowType: { Login: "login" },
  FrontendApi: class {
    getLoginFlowRaw(
      request: { id: string; cookie?: string },
      init: { headers: Headers },
    ) {
      state.request = { ...request, headers: init.headers };
      return Promise.resolve({
        value: async () => ({ id: request.id, type: "browser" }),
      });
    }
  },
}));

vi.mock("@ory/nextjs/app", () => ({
  getFlowFactory: vi.fn(
    async (
      params: Record<string, string | string[] | undefined>,
      fetchFlow: () => Promise<{ value: () => Promise<unknown> }>,
    ) => {
      if (!params.flow) {
        return null;
      }

      if (params.flow === "invalid-flow") {
        throw new Error("self_service_flow_expired");
      }

      return (await fetchFlow()).value();
    },
  ),
}));

vi.mock("@/ory.config", () => ({ orySdkUrl: "https://ory.example.com" }));
vi.mock("@/lib/ory/request", async () => import("./request"));

import { flowRequestHeaders } from "./request";
import { getLoginFlowWithRequestHeaders } from "./login";

describe("login flow request headers", () => {
  it("forwards the browser cookie and required request headers", () => {
    const result = flowRequestHeaders(
      new Headers({
        accept: "text/html",
        cookie: "csrf_token=valid-flow-cookie",
        origin: "https://auth.example.com",
        referer: "https://auth.example.com/auth/login",
        "user-agent": "Mozilla/5.0",
        authorization: "Bearer must-not-forward",
      }),
    );

    expect(result.get("cookie")).toBe("csrf_token=valid-flow-cookie");
    expect(result.get("accept")).toBe("application/json");
    expect(result.get("origin")).toBe("https://auth.example.com");
    expect(result.get("referer")).toBe("https://auth.example.com/auth/login");
    expect(result.get("user-agent")).toBe("Mozilla/5.0");
    expect(result.get("authorization")).toBeNull();
  });

  it("does not invent a cookie when the browser has none", () => {
    const result = flowRequestHeaders(new Headers());

    expect(result.get("cookie")).toBeNull();
    expect(result.get("accept")).toBe("application/json");
  });

  it("does not weaken CSRF protection by adding a synthetic cookie", () => {
    const result = flowRequestHeaders(
      new Headers({ cookie: "session=unrelated; csrf_token=invalid" }),
    );

    expect(result.get("cookie")).toBe("session=unrelated; csrf_token=invalid");
    expect(result.get("x-csrf-token")).toBeNull();
  });
});

describe("getLoginFlowWithRequestHeaders", () => {
  beforeEach(() => {
    state.incoming = new Headers({
      cookie: "csrf_token=valid-flow-cookie",
      host: "auth.example.com",
      "user-agent": "Mozilla/5.0",
      "x-forwarded-proto": "https",
    });
    state.request = undefined;
  });

  it("loads a flow with the browser cookie and request headers", async () => {
    const flow = await getLoginFlowWithRequestHeaders({ flow: "flow-id" });

    expect(flow).toEqual({ id: "flow-id", type: "browser" });
    expect(state.request?.id).toBe("flow-id");
    expect(state.request?.cookie).toBe("csrf_token=valid-flow-cookie");
    expect(state.request?.headers.get("cookie")).toBe(
      "csrf_token=valid-flow-cookie",
    );
    expect(state.request?.headers.get("user-agent")).toBe("Mozilla/5.0");
    expect(state.request?.headers.get("accept")).toBe("application/json");
  });

  it("does not fetch or loop when the flow parameter is missing", async () => {
    const flow = await getLoginFlowWithRequestHeaders({});

    expect(flow).toBeNull();
    expect(state.request).toBeUndefined();
  });

  it("leaves invalid-flow handling to the existing safe page fallback", async () => {
    await expect(
      getLoginFlowWithRequestHeaders({ flow: "invalid-flow" }),
    ).rejects.toThrow("self_service_flow_expired");

    expect(state.request).toBeUndefined();
    expect(state.incoming.get("cookie")).toBe("csrf_token=valid-flow-cookie");
  });
});
