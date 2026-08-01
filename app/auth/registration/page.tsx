import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { isSelfServiceFlowDisabled } from "@ory/client-fetch";
import { getRegistrationFlow, type OryPageParams } from "@ory/nextjs/app";

import { AuthContent } from "@/components/layout/auth-shell";
import { AuthFlowPage } from "@/components/ory/auth-flow-page";
import { OrySetupState } from "@/components/ory/setup-state";
import { rewriteOryFlow } from "@/lib/ory/url";
import { isOryFlowRestartRedirect } from "@/lib/ory/redirect";
import config, { isOryConfigured } from "@/ory.config";
import { getTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  return { title: t("home.hero.createIdentity") };
}

export default async function RegistrationPage({
  searchParams,
}: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  const params = await searchParams;

  if (!isOryConfigured) {
    return (
      <AuthContent
        description={t("auth.registration.description")}
        eyebrow={t("auth.registration.eyebrow")}
        footer={
          <span>
            {t("auth.registration.footer.alreadyAccess")}{" "}
            <Link className="font-medium text-primary hover:underline" href="/auth/login">
              {t("auth.registration.footer.signIn")}
            </Link>
          </span>
        }
        title={t("auth.registration.title")}
      >
        <OrySetupState />
      </AuthContent>
    );
  }

  let rawFlow = null;
  try {
    rawFlow = await getRegistrationFlow(config, params);
  } catch (e) {
    // Restart stale registration flows at the clean route. Disabled registration
    // is handled by the explicit flow error below when the provider returns it.
    if (typeof params.flow === "string" && isOryFlowRestartRedirect(e, "registration")) {
      redirect("/auth/registration");
    }

    unstable_rethrow(e);
    // flow stays null -> FlowUnavailable renders
  }

  if (isSelfServiceFlowDisabled(rawFlow)) {
    const errorParams = new URLSearchParams({ reason: "registration_disabled" });
    if (typeof params.lang === "string") {
      errorParams.set("lang", params.lang);
    }
    redirect(`/auth/error?${errorParams.toString()}`);
  }

  const flow = rewriteOryFlow(rawFlow) || null;

  return (
    <AuthFlowPage
      description={t("auth.registration.description")}
      eyebrow={t("auth.registration.eyebrow")}
      flow={flow}
      footer={
        <span>
          {t("auth.registration.footer.alreadyAccess")}{" "}
          <Link className="font-medium text-primary hover:underline" href="/auth/login">
            {t("auth.registration.footer.signIn")}
          </Link>
        </span>
      }
      kind="registration"
      title={t("auth.registration.title")}
    />
  );
}
