import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  incoming: new Headers(),
  requests: [] as Array<{ flow: string; id: string; cookie?: string }>,
  factories: [] as Array<{ flowType: string; baseUrl: string; route: string }>,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => state.incoming),
}));

vi.mock("@ory/client-fetch", () => ({
  Configuration: class {
    constructor(public options: unknown) {}
  },
  FlowType: {
    Login: "login",
    Registration: "registration",
    Recovery: "recovery",
    Verification: "verification",
    Settings: "settings",
  },
  FrontendApi: class {
    private getFlow(flow: string, request: { id: string; cookie?: string }) {
      state.requests.push({ flow, ...request });
      return Promise.resolve({
        value: async () => ({ flow, id: request.id }),
      });
    }

    getLoginFlowRaw(request: { id: string; cookie?: string }) {
      return this.getFlow("login", request);
    }

    getRegistrationFlowRaw(request: { id: string; cookie?: string }) {
      return this.getFlow("registration", request);
    }

    getRecoveryFlowRaw(request: { id: string; cookie?: string }) {
      return this.getFlow("recovery", request);
    }

    getVerificationFlowRaw(request: { id: string; cookie?: string }) {
      return this.getFlow("verification", request);
    }

    getSettingsFlowRaw(request: { id: string; cookie?: string }) {
      return this.getFlow("settings", request);
    }
  },
}));

vi.mock("@ory/nextjs/app", () => ({
  getFlowFactory: vi.fn(
    async (
      params: Record<string, string | string[] | undefined>,
      fetchFlow: () => Promise<{ value: () => Promise<unknown> }>,
      flowType: string,
      baseUrl: string,
      route: string,
    ) => {
      state.factories.push({ baseUrl, flowType, route });
      return params.flow ? (await fetchFlow()).value() : null;
    },
  ),
}));

vi.mock("@/ory.config", () => ({
  appBaseUrl: "https://auth.example.com",
  orySdkUrl: "https://ory.example.com",
}));

import {
  getLoginFlowWithRequestHeaders,
  getRecoveryFlowWithRequestHeaders,
  getRegistrationFlowWithRequestHeaders,
  getSettingsFlowWithRequestHeaders,
  getVerificationFlowWithRequestHeaders,
} from "./flow-request";

describe("browser flow requests", () => {
  beforeEach(() => {
    state.incoming = new Headers({
      cookie: "csrf_token=flow-cookie",
      host: "nextjs:3000",
      "x-forwarded-host": "auth.example.com",
      "x-forwarded-proto": "https",
    });
    state.requests = [];
    state.factories = [];
  });

  it("uses the same trusted origin and browser cookie for every Ory flow", async () => {
    const params = { flow: "flow-id" };
    const flows = await Promise.all([
      getLoginFlowWithRequestHeaders(params),
      getRegistrationFlowWithRequestHeaders(params),
      getRecoveryFlowWithRequestHeaders(params),
      getVerificationFlowWithRequestHeaders(params),
      getSettingsFlowWithRequestHeaders(params),
    ]);

    expect(flows.map((flow) => flow && "flow" in flow && flow.flow)).toEqual([
      "login",
      "registration",
      "recovery",
      "verification",
      "settings",
    ]);
    expect(state.requests).toEqual(
      expect.arrayContaining([
        { flow: "login", id: "flow-id", cookie: "csrf_token=flow-cookie" },
        { flow: "registration", id: "flow-id", cookie: "csrf_token=flow-cookie" },
        { flow: "recovery", id: "flow-id", cookie: "csrf_token=flow-cookie" },
        { flow: "verification", id: "flow-id", cookie: "csrf_token=flow-cookie" },
        { flow: "settings", id: "flow-id", cookie: "csrf_token=flow-cookie" },
      ]),
    );
    expect(new Set(state.factories.map((factory) => factory.baseUrl))).toEqual(
      new Set(["https://auth.example.com"]),
    );
  });

  it("rejects a spoofed forwarded origin before calling Ory", async () => {
    state.incoming = new Headers({
      host: "nextjs:3000",
      "x-forwarded-host": "attacker.example",
      "x-forwarded-proto": "https",
    });

    await expect(getRecoveryFlowWithRequestHeaders({ flow: "flow-id" })).rejects.toThrow(
      "does not match configured application base URL",
    );
    expect(state.requests).toHaveLength(0);
    expect(state.factories).toHaveLength(0);
  });

  it("does not fetch when the flow identifier is absent", async () => {
    const flow = await getVerificationFlowWithRequestHeaders({});

    expect(flow).toBeNull();
    expect(state.requests).toHaveLength(0);
  });
});
