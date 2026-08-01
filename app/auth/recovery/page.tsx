import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { getRecoveryFlow, type OryPageParams } from "@ory/nextjs/app";

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
  return { title: t("auth.login.footer.recoverAccess") };
}

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
            <Link className="font-medium text-primary hover:underline" href="/auth/login">
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
    flow = rewriteOryFlow(await getRecoveryFlow(config, params)) || null;
  } catch (e) {
    if (typeof params.flow === "string" && isOryFlowRestartRedirect(e, "recovery")) {
      redirect("/auth/error");
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
          <Link className="font-medium text-primary hover:underline" href="/auth/login">
            {t("auth.recovery.footer.returnSignIn")}
          </Link>
        </span>
      }
      kind="recovery"
      title={t("auth.recovery.title")}
    />
  );
}
