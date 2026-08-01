import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
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

  let flow = null;
  try {
    flow =
      rewriteOryFlow(await getRegistrationFlow(config, searchParams)) || null;
  } catch (e) {
    // The SDK restarts missing registration flows indefinitely when registration
    // is disabled. Show the error UI instead of redirecting back into that loop.
    if (isOryFlowRestartRedirect(e, "registration")) {
      redirect("/auth/error");
    }

    unstable_rethrow(e);
    // flow stays null -> FlowUnavailable renders
  }

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
