import { getServerSession } from "@ory/nextjs/app";
import { AuthenticatorAssuranceLevel } from "@ory/client-fetch";
import { redirect } from "next/navigation";

import { getTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type LoginContinuePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Generates the localized title for the login continue page.
 *
 * @param searchParams - Request parameters used to determine the page locale.
 * @returns The localized page metadata.
 */
export async function generateMetadata({ searchParams }: LoginContinuePageProps) {
  const { t } = await getTranslations(searchParams);
  return { title: t("auth.login.title") };
}

function singleParam(params: Record<string, string | string[] | undefined>, name: string) {
  const value = params[name];
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

/**
 * Continues a provider login handoff by checking the Kratos session assurance level.
 *
 * @param searchParams - Request parameters containing the transaction, csrf, and provider callback.
 * @returns Redirects to the provider callback when AAL2 is satisfied, or to a step-up login flow.
 */
export default async function LoginContinuePage({ searchParams }: LoginContinuePageProps) {
  const params = await searchParams;
  const transaction = singleParam(params, "transaction");
  const csrf = singleParam(params, "csrf");
  const providerCallback = singleParam(params, "provider_callback");

  if (!transaction || !csrf || !providerCallback) {
    redirect("/auth/error?reason=invalid_request");
  }

  const session = await getServerSession();
  if (!session) {
    const loginSearch = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") {
        loginSearch.set(key, value);
      }
    }
    const continuePath = `/auth/login/continue?${loginSearch.toString()}`;
    redirect(`/auth/login?return_to=${encodeURIComponent(continuePath)}`);
  }

  const aal = session.authenticator_assurance_level;
  if (aal !== AuthenticatorAssuranceLevel.Aal2 && aal !== AuthenticatorAssuranceLevel.Aal3) {
    const continueSearch = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") {
        continueSearch.set(key, value);
      }
    }
    const continueQs = continueSearch.toString();
    const returnToPath = `/auth/login/continue${continueQs ? `?${continueQs}` : ""}`;
    const stepUp = new URL("/self-service/login/browser", "https://sso.invalid");
    stepUp.searchParams.set("aal", "aal2");
    stepUp.searchParams.set("return_to", returnToPath);
    stepUp.searchParams.set("refresh", "true");
    redirect(stepUp.pathname + stepUp.search);
  }

  const callback = new URL(providerCallback);
  callback.searchParams.set("transaction", transaction);
  callback.searchParams.set("csrf", csrf);
  redirect(callback.toString());
}
