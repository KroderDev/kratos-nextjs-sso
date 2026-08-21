import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { isSelfServiceFlowDisabled } from "@ory/client-fetch";
import type { OryPageParams } from "@ory/nextjs/app";

import { AuthContent } from "@/components/layout/auth-shell";
import { AuthFlowPage } from "@/components/ory/auth-flow-page";
import { OrySetupState } from "@/components/ory/setup-state";
import { rewriteOryFlow } from "@/lib/ory/url";
import { isOryConfigured } from "@/ory.config";
import { getTranslations } from "@/lib/i18n/server";
import { getRecoveryFlowWithRequestHeaders } from "@/lib/ory/flow-request";
import { isOryFlowRestartRedirect } from "@/lib/ory/redirect";
import { buildCleanFlowUrl } from "@/lib/ory/params";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  return { title: t("auth.login.footer.recoverAccess") };
}

/**
 * Renders the localized account recovery page and recovery flow.
 *
 * @param searchParams - URL parameters used to load the recovery flow and preserve the language.
 */
export default async function RecoveryPage({ searchParams }: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  const params = await searchParams;

  if (!isOryConfigured) {
    return (
      <AuthContent
        description={t("auth.recovery.description")}
        eyebrow={t("auth.recovery.eyebrow")}
        footer={
          <span>
            {t("auth.recovery.footer.rememberedDetails")}{" "}
            <Link className="font-medium text-primary hover:underline" href="/login">
              {t("auth.recovery.footer.returnSignIn")}
            </Link>
          </span>
        }
        title={t("auth.recovery.title")}
      >
        <OrySetupState />
      </AuthContent>
    );
  }

  let flow = null;
  try {
    const rawFlow = await getRecoveryFlowWithRequestHeaders(params);

    if (isSelfServiceFlowDisabled(rawFlow)) {
      const errorParams = new URLSearchParams({ reason: "recovery_disabled" });
      if (typeof params.lang === "string") {
        errorParams.set("lang", params.lang);
      }
      redirect(`/error?${errorParams.toString()}`);
    }

    flow = rewriteOryFlow(rawFlow) || null;
  } catch (e) {
    if (typeof params.flow === "string" && isOryFlowRestartRedirect(e, "recovery")) {
      redirect(buildCleanFlowUrl("/recovery", params, ["lang"]));
    }
    unstable_rethrow(e);
    // flow stays null -> FlowUnavailable renders
  }

  return (
    <AuthFlowPage
      description={t("auth.recovery.description")}
      eyebrow={t("auth.recovery.eyebrow")}
      flow={flow}
      footer={
        <span>
          {t("auth.recovery.footer.rememberedDetails")}{" "}
          <Link className="font-medium text-primary hover:underline" href="/login">
            {t("auth.recovery.footer.returnSignIn")}
          </Link>
        </span>
      }
      kind="recovery"
      title={t("auth.recovery.title")}
    />
  );
}
