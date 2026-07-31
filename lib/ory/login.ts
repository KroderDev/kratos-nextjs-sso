import { headers } from "next/headers";
import {
  Configuration,
  FlowType,
  FrontendApi,
  type LoginFlow,
} from "@ory/client-fetch";
import { getFlowFactory } from "@ory/nextjs/app";

import { orySdkUrl } from "@/ory.config";
import { flowRequestHeaders } from "@/lib/ory/request";

type LoginParams = Record<string, string | string[] | undefined>;

/**
 * Constructs the public URL from the incoming request headers.
 *
 * @returns The public URL using the forwarded protocol or `http` and the request host.
 */
async function publicUrl() {
  const incoming = await headers();
  const host = incoming.get("host");
  const protocol = incoming.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
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
