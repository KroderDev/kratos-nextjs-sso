import { redirect } from "next/navigation";

import { getSafeLogoutFlow } from "@/lib/ory/logout";
import { providerLogoutParams } from "@/lib/ory/provider-handoff";

export const dynamic = "force-dynamic";

type LogoutPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Clears the Kratos session before returning to the login-consent provider.
 * The provider callback remains the authority that completes the Hydra logout.
 */
export default async function LogoutPage({ searchParams }: LogoutPageProps) {
  const params = await searchParams;
  const handoff = providerLogoutParams(params);

  if (!handoff) {
    redirect("/error?reason=invalid_request");
  }

  const logoutFlow = await getSafeLogoutFlow(handoff.providerReturnTo);
  if (logoutFlow.logout_url === "#") {
    redirect("/error?reason=logout_unavailable");
  }

  redirect(logoutFlow.logout_url);
}
