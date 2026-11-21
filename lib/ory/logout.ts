import {
  Configuration,
  FrontendApi,
  ResponseError,
  type LogoutFlow,
  type Session,
} from "@ory/client-fetch";
import { getLogoutFlow } from "@ory/nextjs/app";

import { appBaseUrl, oryProviderOrigin, orySdkUrl } from "@/ory.config";
import { LOGOUT_CONTINUATION_COOKIE } from "./logout-continuation";
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

function kratosCookies(cookieHeader: string | null | undefined): string {
  return (cookieHeader ?? "")
    .split(";")
    .filter((cookie) => cookie.split("=", 1)[0].trim() !== LOGOUT_CONTINUATION_COOKIE)
    .join(";")
    .trim();
}

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

async function readOryError(response: Response): Promise<Record<string, unknown> | null> {
  const mediaType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (mediaType !== "application/json" && !mediaType?.endsWith("+json")) {
    return null;
  }

  try {
    const payload = await response.json();
    const error: unknown = payload?.error;
    return error && typeof error === "object" && !Array.isArray(error)
      ? (error as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

const KRATOS_NO_SESSION_MESSAGE = "The request could not be authorized";
const KRATOS_NO_SESSION_REASON =
  "No valid session credentials found in the request.";

async function isKratosNoSessionResponse(response: Response): Promise<boolean> {
  if (response.status !== 401 || response.headers.has("www-authenticate")) {
    return false;
  }

  const error = await readOryError(response);
  if (!error || error.code !== 401) {
    return false;
  }

  // Kratos ErrNoActiveSessionFound (session/manager.go, returned by /self-service/logout/browser
  // and documented whoami responses) carries error.id = "session_inactive".
  if (error.id === "session_inactive") {
    return true;
  }

  // Kratos v26.2.0 /sessions/whoami (session/handler.go + session/error.go + herodot v0.10.8)
  // wraps ErrNoActiveSessionFound inside ErrNoSessionFound (herodot.ErrUnauthorized with empty
  // IDField), omitting error.id and serializing these exact fields. Fail closed on any other 401.
  return (
    (error.id === undefined || error.id === "") &&
    error.status === "Unauthorized" &&
    error.message === KRATOS_NO_SESSION_MESSAGE &&
    error.reason === KRATOS_NO_SESSION_REASON
  );
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
    const cookie = kratosCookies(cookieHeader);
    const response = await client.toSessionRaw(
      cookie ? { cookie } : {},
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
    if (!(error instanceof ResponseError)) {
      return { state: "error" };
    }

    const { response } = error;
    if (await isKratosNoSessionResponse(response)) {
      return { state: "no_session" };
    }

    if (response.status === 403 && (await readOryError(response))?.id === "session_aal2_required") {
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
        cookie: kratosCookies(cookieHeader),
        returnTo,
      },
      createKratosRequestInit(),
    );
    const rawFlow = await response.value();
    const processed = withApplicationLogoutUrl(rawFlow);

    if (processed.logout_url === "#") {
      return { status: "unavailable" };
    }

    const parsed = new URL(processed.logout_url, appBaseUrl ?? orySdkUrl);
    if (parsed.hash || parsed.pathname !== "/self-service/logout") {
      return { status: "unavailable" };
    }

    const tokens = parsed.searchParams.getAll("token");
    if (tokens.length !== 1 || !tokens[0].trim()) {
      return { status: "unavailable" };
    }

    if (tokens[0] !== rawFlow.logout_token) {
      return { status: "unavailable" };
    }

    const returnTos = parsed.searchParams.getAll("return_to");
    if (returnTos.length !== 1 || returnTos[0] !== returnTo) {
      return { status: "unavailable" };
    }

    return { status: "ready", logoutUrl: parsed.href };
  } catch (error) {
    if (error instanceof ResponseError && (await isKratosNoSessionResponse(error.response))) {
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
