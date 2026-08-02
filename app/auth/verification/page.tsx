import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { getVerificationFlow, type OryPageParams } from "@ory/nextjs/app";

import { AuthContent } from "@/components/layout/auth-shell";
import { AuthFlowPage } from "@/components/ory/auth-flow-page";
import { OrySetupState } from "@/components/ory/setup-state";
import { rewriteOryFlow } from "@/lib/ory/url";
import config, { isOryConfigured } from "@/ory.config";
import { getTranslations } from "@/lib/i18n/server";
import { isOryFlowRestartRedirect } from "@/lib/ory/redirect";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  return { title: t("auth.verification.eyebrow") };
}

/**
 * Renders the localized Ory verification page.
 *
 * Displays setup information when Ory is unavailable and otherwise loads the verification flow, redirecting to a fresh flow when the current one must be restarted.
 *
 * @param searchParams - Request search parameters used to load the verification flow and translations
 */
export default async function VerificationPage({
  searchParams,
}: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  const params = await searchParams;

  if (!isOryConfigured) {
    return (
      <AuthContent
        description={t("auth.verification.description")}
        eyebrow={t("auth.verification.eyebrow")}
        footer={
          <span>
            {t("auth.verification.footer.needStartOver")}{" "}
            <Link className="font-medium text-primary hover:underline" href="/auth/login">
              {t("auth.verification.footer.returnSignIn")}
            </Link>
          </span>
        }
        title={t("auth.verification.title")}
      >
        <OrySetupState />
      </AuthContent>
    );
  }

  let flow = null;
  try {
    flow =
      rewriteOryFlow(await getVerificationFlow(config, params)) || null;
  } catch (e) {
    if (typeof params.flow === "string" && isOryFlowRestartRedirect(e, "verification")) {
      redirect("/auth/verification");
    }
    unstable_rethrow(e);
    // flow stays null -> FlowUnavailable renders
  }

  return (
    <AuthFlowPage
      description={t("auth.verification.description")}
      eyebrow={t("auth.verification.eyebrow")}
      flow={flow}
      footer={
        <span>
          {t("auth.verification.footer.needStartOver")}{" "}
          <Link className="font-medium text-primary hover:underline" href="/auth/login">
            {t("auth.verification.footer.returnSignIn")}
          </Link>
        </span>
      }
      kind="verification"
      title={t("auth.verification.title")}
    />
  );
}
