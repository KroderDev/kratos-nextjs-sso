import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  checkKratosSessionStatus,
  createProviderLogoutFlow,
} from "@/lib/ory/logout";
import {
  createLogoutContinuationToken,
  formatClearLogoutContinuationCookie,
  formatLogoutContinuationCookie,
  isSecureOrigin,
  LOGOUT_COMPLETE_PATH,
} from "@/lib/ory/logout-continuation";
import {
  providerLogoutParams,
  type FlowSearchParams,
} from "@/lib/ory/provider-handoff";
import {
  getForwardedOrigin,
  isValidApplicationOrigin,
} from "@/lib/ory/request";
import { appBaseUrl, isOryConfigured } from "@/ory.config";

export const dynamic = "force-dynamic";

const NO_STORE_CACHE_CONTROL = "no-store, no-cache, must-revalidate, max-age=0";

function searchParamsToRecord(searchParams: URLSearchParams): FlowSearchParams {
  const params: FlowSearchParams = {};

  for (const key of ["flow", "transaction", "csrf", "return_to", "lang"]) {
    const values = searchParams.getAll(key);
    if (values.length) params[key] = values.length === 1 ? values[0] : values;
  }

  return params;
}

function resolveLogoutOrigin(request: NextRequest): string | null {
  if (appBaseUrl) {
    if (!isValidApplicationOrigin(appBaseUrl)) {
      return null;
    }
    return new URL(appBaseUrl).origin;
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return getForwardedOrigin(request.headers, request.nextUrl.origin);
}

function buildLogoutRedirect(destination: string, cookieHeader: string) {
  const response = NextResponse.redirect(destination, { status: 303 });
  response.headers.set("Cache-Control", NO_STORE_CACHE_CONTROL);
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "no-referrer");

  response.headers.append("Set-Cookie", cookieHeader);

  return response;
}

/**
 * Starts a provider-mediated logout by validating the adapter handoff, verifying
 * real Kratos session state, binding a short-lived continuation cookie, and
 * redirecting either to Kratos browser logout (returning to `/logout/complete`)
 * or directly to `/logout/complete` when already signed out.
 */
export async function GET(request: NextRequest) {
  const publicOrigin = resolveLogoutOrigin(request);
  if (!publicOrigin) {
    return new NextResponse("Invalid application configuration", {
      status: 503,
      headers: {
        "Cache-Control": NO_STORE_CACHE_CONTROL,
        Pragma: "no-cache",
        "Referrer-Policy": "no-referrer",
      },
    });
  }

  const secure = isSecureOrigin(publicOrigin);
  const clearCookie = formatClearLogoutContinuationCookie(secure);
  const errorDestination = (reason: "invalid_request" | "logout_unavailable") =>
    new URL(`/error?reason=${reason}`, publicOrigin).toString();

  const handoff = providerLogoutParams(
    searchParamsToRecord(request.nextUrl.searchParams),
  );
  if (!handoff) {
    return buildLogoutRedirect(errorDestination("invalid_request"), clearCookie);
  }

  if (!isOryConfigured) {
    return buildLogoutRedirect(
      errorDestination("logout_unavailable"),
      clearCookie,
    );
  }

  const token = createLogoutContinuationToken(handoff);
  if (!token) {
    return buildLogoutRedirect(errorDestination("invalid_request"), clearCookie);
  }
  const continuationCookie = formatLogoutContinuationCookie(token, secure);
  const completeUrl = new URL(LOGOUT_COMPLETE_PATH, publicOrigin).toString();

  const cookieHeader = request.headers.get("cookie");
  const sessionStatus = await checkKratosSessionStatus(cookieHeader);
  if (sessionStatus.state === "error") {
    return buildLogoutRedirect(
      errorDestination("logout_unavailable"),
      clearCookie,
    );
  }

  if (sessionStatus.state === "no_session") {
    return buildLogoutRedirect(completeUrl, continuationCookie);
  }

  const flowResult = await createProviderLogoutFlow(completeUrl, cookieHeader);

  if (flowResult.status === "no_session") {
    const rechecked = await checkKratosSessionStatus(cookieHeader);
    if (rechecked.state !== "no_session") {
      return buildLogoutRedirect(
        errorDestination("logout_unavailable"),
        clearCookie,
      );
    }

    return buildLogoutRedirect(completeUrl, continuationCookie);
  }

  if (flowResult.status !== "ready") {
    return buildLogoutRedirect(
      errorDestination("logout_unavailable"),
      clearCookie,
    );
  }

  return buildLogoutRedirect(flowResult.logoutUrl, continuationCookie);
}
