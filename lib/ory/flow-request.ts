import { headers } from "next/headers";
import {
  Configuration,
  FlowType,
  FrontendApi,
  type ApiResponse,
  type LoginFlow,
  type RecoveryFlow,
  type RegistrationFlow,
  type SettingsFlow,
  type VerificationFlow,
} from "@ory/client-fetch";
import { getFlowFactory } from "@ory/nextjs/app";

import { appBaseUrl, orySdkUrl } from "@/ory.config";

import {
  flowRequestHeaders,
  getForwardedOrigin,
  validateForwardedOrigin,
} from "./request";

export type BrowserFlowParams = Record<string, string | string[] | undefined>;

type FlowRequest = {
  id: string;
  cookie?: string;
};

type RawFlowFetcher<T extends object> = (
  client: FrontendApi,
  request: FlowRequest,
  init: RequestInit,
) => Promise<ApiResponse<T>>;

function fallbackOrigin(incoming: Headers) {
  const host = incoming.get("host");
  return `http://${host || "localhost"}`;
}

function publicOrigin(incoming: Headers) {
  const origin = getForwardedOrigin(incoming, fallbackOrigin(incoming));

  if (!appBaseUrl && process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL must be configured for Ory browser flows");
  }

  if (!validateForwardedOrigin(origin, appBaseUrl)) {
    throw new Error(
      `Forwarded origin ${origin} does not match configured application base URL ${appBaseUrl}`,
    );
  }

  return origin;
}

async function getBrowserFlow<T extends object>(
  params: BrowserFlowParams | Promise<BrowserFlowParams>,
  flowType: FlowType,
  route: string,
  fetchFlow: RawFlowFetcher<T>,
): Promise<T | null | void> {
  const resolvedParams = await params;
  const incoming = await headers();
  const request: FlowRequest = {
    id: typeof resolvedParams.flow === "string" ? resolvedParams.flow : "",
    cookie: incoming.get("cookie") ?? undefined,
  };
  const client = new FrontendApi(
    new Configuration({
      basePath: orySdkUrl,
    }),
  );

  return getFlowFactory<T>(
    resolvedParams,
    () =>
      fetchFlow(client, request, {
        cache: "no-cache",
        headers: flowRequestHeaders(incoming),
      }),
    flowType,
    publicOrigin(incoming),
    route,
  );
}

export function getLoginFlowWithRequestHeaders(
  params: BrowserFlowParams | Promise<BrowserFlowParams>,
): Promise<LoginFlow | null | void> {
  return getBrowserFlow(
    params,
    FlowType.Login,
    "/login",
    (client, request, init) => client.getLoginFlowRaw(request, init),
  );
}

export function getRegistrationFlowWithRequestHeaders(
  params: BrowserFlowParams | Promise<BrowserFlowParams>,
): Promise<RegistrationFlow | null | void> {
  return getBrowserFlow(
    params,
    FlowType.Registration,
    "/registration",
    (client, request, init) => client.getRegistrationFlowRaw(request, init),
  );
}

export function getRecoveryFlowWithRequestHeaders(
  params: BrowserFlowParams | Promise<BrowserFlowParams>,
): Promise<RecoveryFlow | null | void> {
  return getBrowserFlow(
    params,
    FlowType.Recovery,
    "/recovery",
    (client, request, init) => client.getRecoveryFlowRaw(request, init),
  );
}

export function getVerificationFlowWithRequestHeaders(
  params: BrowserFlowParams | Promise<BrowserFlowParams>,
): Promise<VerificationFlow | null | void> {
  return getBrowserFlow(
    params,
    FlowType.Verification,
    "/verification",
    (client, request, init) => client.getVerificationFlowRaw(request, init),
  );
}

export function getSettingsFlowWithRequestHeaders(
  params: BrowserFlowParams | Promise<BrowserFlowParams>,
): Promise<SettingsFlow | null | void> {
  return getBrowserFlow(
    params,
    FlowType.Settings,
    "/dashboard/settings",
    (client, request, init) => client.getSettingsFlowRaw(request, init),
  );
}
