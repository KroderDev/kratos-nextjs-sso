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
  isValidApplicationOrigin,
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

/**
 * Uses the configured application origin or builds an HTTP origin from the incoming host header.
 *
 * @param incoming - The request headers containing the host value
 * @returns The configured origin, or an HTTP origin using the host header or `localhost`
 */
function fallbackOrigin(incoming: Headers) {
  if (appBaseUrl && isValidApplicationOrigin(appBaseUrl)) {
    return new URL(appBaseUrl).origin;
  }

  const host = incoming.get("host");
  return `http://${host || "localhost"}`;
}

/**
 * Determines and validates the public origin for an incoming request.
 *
 * @param incoming - The request headers used to resolve the forwarded origin.
 * @returns The validated public origin.
 */
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

/**
 * Retrieves a browser flow using the incoming request headers and flow parameters.
 *
 * @param params - Query parameters containing the flow identifier
 * @param flowType - The browser flow type to retrieve
 * @param route - The route associated with the flow
 * @returns The requested flow, `null`, or `undefined`
 */
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

/**
 * Retrieves the login flow using the incoming request headers.
 *
 * @param params - Login flow query parameters or a promise resolving to them
 * @returns The login flow, `null`, or `void`
 */
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

/**
 * Retrieves the Ory registration flow using the incoming request headers.
 *
 * @param params - Registration flow query parameters
 * @returns The registration flow, `null`, or `void`
 */
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

/**
 * Retrieves the Ory recovery flow using the incoming request headers.
 *
 * @param params - Query parameters for the recovery flow
 * @returns The recovery flow, `null`, or `void`
 */
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

/**
 * Retrieves the Ory verification flow using the incoming request headers.
 *
 * @param params - Parameters used to identify the verification flow
 * @returns The verification flow, `null`, or `void` when no flow is available
 */
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

/**
 * Retrieves the Ory settings flow using the incoming request headers.
 *
 * @param params - Query parameters for the settings flow
 * @returns The settings flow, `null`, or `void`
 */
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
