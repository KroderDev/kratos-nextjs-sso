import { headers } from "next/headers";
import {
  Configuration,
  FlowType,
  FrontendApi,
  type LoginFlow,
} from "@ory/client-fetch";
import { getFlowFactory } from "@ory/nextjs/app";

import { appBaseUrl, orySdkUrl } from "@/ory.config";
import {
  flowRequestHeaders,
  getForwardedOrigin,
  validateForwardedOrigin,
} from "@/lib/ory/request";

type LoginParams = Record<string, string | string[] | undefined>;

/**
 * Builds the public URL for the incoming request.
 *
 * @returns The forwarded origin when available; otherwise, an HTTP URL using the request host.
 * @throws {Error} When the forwarded origin does not match the configured application base URL
 */
async function publicUrl() {
  const incoming = await headers();
  const host = incoming.get("host");
  const origin = getForwardedOrigin(incoming, `http://${host}`);

  if (!validateForwardedOrigin(origin, appBaseUrl)) {
    throw new Error(
      `Forwarded origin ${origin} does not match configured app base URL ${appBaseUrl}`,
    );
  }

  return origin;
}

/**
 * Retrieves the login flow using the current request headers and public URL.
 *
 * @param params - Login flow parameters or a promise resolving to them
 * @returns The login flow, `null`, or `void`
 */
export async function getLoginFlowWithRequestHeaders(
  params: LoginParams | Promise<LoginParams>,
): Promise<LoginFlow | null | void> {
  const resolvedParams = await params;
  const incoming = await headers();
  const client = new FrontendApi(
    new Configuration({
      basePath: orySdkUrl,
    }),
  );

  return getFlowFactory(
    resolvedParams,
    () =>
      client.getLoginFlowRaw(
        {
          id: typeof resolvedParams.flow === "string" ? resolvedParams.flow : "",
          cookie: incoming.get("cookie") ?? undefined,
        },
        {
          cache: "no-cache",
          headers: flowRequestHeaders(incoming),
        },
      ),
    FlowType.Login,
    await publicUrl(),
    "/auth/login",
  );
}
