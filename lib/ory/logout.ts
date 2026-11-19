import {
  Configuration,
  FrontendApi,
  ResponseError,
  type LogoutFlow,
  type Session,
} from "@ory/client-fetch";
import { getLogoutFlow } from "@ory/nextjs/app";

import { appBaseUrl, oryProviderOrigin, orySdkUrl } from "@/ory.config";
import { httpOrigin } from "./security";

export const KRATOS_REQUEST_TIMEOUT_MS = 5_000;

export type KratosSessionStatus =
  | { state: "active"; session?: Session }
  | { state: "no_session" }
  | { state: "error" };

export type ProviderLogoutFlowResult =
  | { status: "ready"; logoutUrl: string }
  | { status: "no_session" }
  | { status: "unavailable" };

function createKratosFrontendClient() {
  return new FrontendApi(
    new Configuration({
      basePath: orySdkUrl,
      headers: { Accept: "application/json" },
    }),
  );
}

function createKratosRequestInit(): RequestInit {
  return {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(KRATOS_REQUEST_TIMEOUT_MS),
  };
}

function getErrorResponse(error: unknown): Response | null {
  if (error instanceof ResponseError) {
    return error.response;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: unknown }).response !== null &&
    typeof (error as { response: { status?: unknown } }).response.status === "number"
  ) {
    return (error as { response: Response }).response;
  }

  return null;
}

async function readErrorJson(response: Response): Promise<Record<string, unknown> | null | "invalid_json" | "empty"> {
  try {
    const cloned = typeof response.clone === "function" ? response.clone() : response;
    const text = await cloned.text();
    if (!text.trim()) {
      return "empty";
    }
    const parsed = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : "invalid_json";
  } catch {
    return "invalid_json";
  }
}

function extractOryErrorField(
  payload: Record<string, unknown>,
): { code?: unknown; id?: unknown } {
  const inner = payload.error;
  if (typeof inner === "object" && inner !== null) {
    return inner as { code?: unknown; id?: unknown };
  }
  return {};
}

async function isKratosNoSessionResponse(response: Response): Promise<boolean> {
  if (response.status !== 401) {
    return false;
  }

  if (response.headers?.get("www-authenticate")) {
    return false;
  }

  const contentType = response.headers?.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("json")) {
    return false;
  }

  const parsed = await readErrorJson(response);
  if (!parsed || parsed === "empty" || parsed === "invalid_json") {
    return false;
  }

  // Kratos /sessions/whoami and session checks return 401 JSON with error.id = "session_inactive".
  // Fail closed on empty or generic upstream 401 responses.
  return extractOryErrorField(parsed).id === "session_inactive";
}

async function isKratosAal2RequiredResponse(response: Response): Promise<boolean> {
  if (response.status !== 403) {
    return false;
  }

  const contentType = response.headers?.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("json")) {
    return false;
  }

  const parsed = await readErrorJson(response);
  if (!parsed || parsed === "empty" || parsed === "invalid_json") {
    return false;
  }

  return extractOryErrorField(parsed).id === "session_aal2_required";
}

/**
 * Checks Kratos `/sessions/whoami` directly so callers can distinguish an active
 * session, a genuine Kratos `401` `session_inactive` response, and upstream/network errors.
 *
 * @param cookieHeader - The browser's incoming `Cookie` header
 * @returns The resolved Kratos session status
 */
export async function checkKratosSessionStatus(
  cookieHeader: string | null | undefined,
): Promise<KratosSessionStatus> {
  if (!orySdkUrl) {
    return { state: "error" };
  }

  try {
    const client = createKratosFrontendClient();
    const response = await client.toSessionRaw(
      cookieHeader ? { cookie: cookieHeader } : {},
      createKratosRequestInit(),
    );
    const session = await response.value();

    if (!session || typeof session !== "object") {
      return { state: "error" };
    }

    if (session.active === false) {
      return { state: "no_session" };
    }

    if (session.id || session.identity || session.active === true) {
      return { state: "active", session };
    }

    return { state: "error" };
  } catch (error) {
    const response = getErrorResponse(error);
    if (!response) {
      return { state: "error" };
    }

    if (await isKratosNoSessionResponse(response)) {
      return { state: "no_session" };
    }

    if (await isKratosAal2RequiredResponse(response)) {
      return { state: "active" };
    }

    return { state: "error" };
  }
}

/**
 * Creates a Kratos browser logout flow for a provider-mediated logout using the
 * fixed application completion URL. Never falls back to dropping `returnTo`, and
 * validates that Kratos returns `/self-service/logout` with `token` and exact `return_to`.
 *
 * @param returnTo - The fixed application-owned completion URL (e.g. `/logout/complete`)
 * @param cookieHeader - The browser's incoming `Cookie` header
 * @returns The validated logout URL, a genuine no-session indicator, or an unavailable status
 */
export async function createProviderLogoutFlow(
  returnTo: string,
  cookieHeader: string | null | undefined,
): Promise<ProviderLogoutFlowResult> {
  if (!orySdkUrl || !httpOrigin(returnTo)) {
    return { status: "unavailable" };
  }

  try {
    const client = createKratosFrontendClient();
    const response = await client.createBrowserLogoutFlowRaw(
      {
        cookie: cookieHeader ?? "",
        returnTo,
      },
      createKratosRequestInit(),
    );
    const rawFlow = await response.value();
    const processed = withApplicationLogoutUrl(rawFlow);

    if (processed.logout_url === "#") {
      return { status: "unavailable" };
    }

    const parsed = new URL(processed.logout_url, appBaseUrl || orySdkUrl);
    if (
      parsed.username ||
      parsed.password ||
      parsed.hash ||
      parsed.pathname !== "/self-service/logout"
    ) {
      return { status: "unavailable" };
    }

    const tokens = parsed.searchParams.getAll("token");
    if (tokens.length !== 1 || !tokens[0].trim()) {
      return { status: "unavailable" };
    }

    if (rawFlow.logout_token && tokens[0] !== rawFlow.logout_token) {
      return { status: "unavailable" };
    }

    const returnTos = parsed.searchParams.getAll("return_to");
    if (returnTos.length !== 1 || returnTos[0] !== returnTo) {
      return { status: "unavailable" };
    }

    return { status: "ready", logoutUrl: processed.logout_url };
  } catch (error) {
    const response = getErrorResponse(error);
    if (response && (await isKratosNoSessionResponse(response))) {
      return { status: "no_session" };
    }

    return { status: "unavailable" };
  }
}

/**
 * Rewrites a provider logout URL to use the application's protocol and host.
 *
 * @param value - The logout URL to rewrite
 * @returns The rewritten URL, or the original value when configuration is missing, the URL does not match the provider origin, or parsing fails
 */
function rewriteLogoutUrl(value: string) {
  if (!appBaseUrl || !orySdkUrl) {
    return value;
  }

  try {
    const applicationUrl = new URL(appBaseUrl);
    const logoutUrl = new URL(value);

    if (
      logoutUrl.origin !== httpOrigin(orySdkUrl) &&
      logoutUrl.origin !== oryProviderOrigin
    ) {
      return value;
    }

    logoutUrl.protocol = applicationUrl.protocol;
    logoutUrl.host = applicationUrl.host;
    logoutUrl.port = applicationUrl.port;
    return logoutUrl.toString();
  } catch {
    return value;
  }
}

/**
 * Determines whether a logout URL resolves to an allowed origin.
 *
 * @param value - The logout URL to validate
 * @returns `true` if the URL resolves to the Ory provider origin or application origin, or if no Ory SDK URL is configured; `false` if the URL cannot be parsed or resolves elsewhere
 */
function isSafeLogoutUrl(value: string) {
  if (!orySdkUrl) {
    return true;
  }

  try {
    const applicationOrigin = appBaseUrl ? new URL(appBaseUrl).origin : undefined;
    const parsed = new URL(value, appBaseUrl ?? orySdkUrl);

    return Boolean(
      httpOrigin(parsed.href) &&
      (parsed.origin === oryProviderOrigin || parsed.origin === applicationOrigin),
    );
  } catch {
    return false;
  }
}

/**
 * Processes a logout flow's URL for application compatibility and safety.
 *
 * @param flow - The logout flow to process
 * @returns The flow with a safe, processed `logout_url`, or `"#"` when the URL is unsafe
 */
function withApplicationLogoutUrl(flow: LogoutFlow): LogoutFlow {
  const logoutUrl = rewriteLogoutUrl(flow.logout_url);

  return {
    ...flow,
    logout_url: isSafeLogoutUrl(logoutUrl) ? logoutUrl : "#",
  };
}

/**
 * Retrieves a logout flow, optionally using a return URL.
 *
 * @param returnTo - The URL to redirect to after logout
 * @returns The logout flow, or a fallback flow with `logout_url` set to `"#"` when retrieval fails
 */
export async function getSafeLogoutFlow(returnTo?: string): Promise<LogoutFlow> {
  if (returnTo) {
    try {
      return withApplicationLogoutUrl(await getLogoutFlow({ returnTo }));
    } catch {
      // Fallback if returnTo fails (e.g. 400 Bad Request when return_to domain is not allowed in Ory project settings)
    }
  }

  try {
    return withApplicationLogoutUrl(await getLogoutFlow());
  } catch {
    return { logout_url: "#", logout_token: "" };
  }
}
