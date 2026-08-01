import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import type { OryPageParams } from "@ory/nextjs/app";

import { AuthContent } from "@/components/layout/auth-shell";
import { AuthFlowPage } from "@/components/ory/auth-flow-page";
import { OrySetupState } from "@/components/ory/setup-state";
import { rewriteOryFlow } from "@/lib/ory/url";
import { isOryConfigured } from "@/ory.config";
import { getTranslations } from "@/lib/i18n/server";
import { getLoginFlowWithRequestHeaders } from "@/lib/ory/login";
import { isOryFlowRestartRedirect } from "@/lib/ory/redirect";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  return { title: t("auth.login.title") };
}

/**
 * Renders the localized login page and its authentication state.
 *
 * @param searchParams - Request parameters used to load translations and retrieve the login flow.
 */
export default async function LoginPage({ searchParams }: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  const params = await searchParams;

  if (!isOryConfigured) {
    return (
      <AuthContent
        description={t("auth.login.description")}
        eyebrow={t("auth.login.eyebrow")}
        footer={
          <span>
            {t("auth.login.footer.needIdentity")}{" "}
            <Link className="font-medium text-primary hover:underline" href="/auth/registration">
              {t("auth.login.footer.createOne")}
            </Link>
          </span>
        }
        title={t("auth.login.title")}
      >
        <OrySetupState />
      </AuthContent>
    );
  }

  let flow = null;
  try {
    flow = rewriteOryFlow(await getLoginFlowWithRequestHeaders(params)) || null;
  } catch (e) {
    if (typeof params.flow === "string" && isOryFlowRestartRedirect(e, "login")) {
      redirect("/auth/error");
    }
    unstable_rethrow(e);
    // flow stays null -> FlowUnavailable renders
  }

  return (
    <AuthFlowPage
      description={t("auth.login.description")}
      eyebrow={t("auth.login.eyebrow")}
      flow={flow}
      footer={
        <span>
          {t("auth.login.footer.needIdentity")}{" "}
          <Link className="font-medium text-primary hover:underline" href="/auth/registration">
            {t("auth.login.footer.createOne")}
          </Link>
          <span className="mx-2 text-border">/</span>
          <Link className="font-medium text-primary hover:underline" href="/auth/recovery">
            {t("auth.login.footer.recoverAccess")}
          </Link>
        </span>
      }
      kind="login"
      title={t("auth.login.title")}
    />
  );
}
