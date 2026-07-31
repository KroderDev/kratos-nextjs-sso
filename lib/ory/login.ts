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

async function publicUrl() {
  const incoming = await headers();
  const host = incoming.get("host");
  const protocol = incoming.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

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
