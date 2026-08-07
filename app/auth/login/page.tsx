import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import type { OryPageParams } from "@ory/nextjs/app";

import { AuthContent } from "@/components/layout/auth-shell";
import { AuthFlowPage } from "@/components/ory/auth-flow-page";
import { OrySetupState } from "@/components/ory/setup-state";
import { hasPasswordLogin, isProviderNode, isSocialOnlyLogin } from "@/lib/ory/flow";
import { rewriteOryFlow } from "@/lib/ory/url";
import { isOryConfigured, isRegistrationEnabled } from "@/ory.config";
import { getTranslations } from "@/lib/i18n/server";
import { getLoginFlowWithRequestHeaders } from "@/lib/ory/login";
import { isProviderHandoff, providerLoginParams } from "@/lib/ory/provider-handoff";
import { isOryFlowRestartRedirect } from "@/lib/ory/redirect";
import { buildCleanFlowUrl } from "@/lib/ory/params";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  return { title: t("auth.login.title") };
}

/**
 * Renders the localized login page with setup, authentication, or flow-unavailable state.
 *
 * @param searchParams - Request parameters used to load translations and retrieve the login flow.
 */
export default async function LoginPage({ searchParams }: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  const params = await searchParams;
  const flowParams = providerLoginParams(params);

  if (!flowParams && isProviderHandoff(params)) {
    redirect("/auth/error?reason=invalid_request");
  }

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
    flow = rewriteOryFlow(await getLoginFlowWithRequestHeaders(flowParams ?? params)) || null;
  } catch (e) {
    if (typeof flowParams?.flow === "string" && isOryFlowRestartRedirect(e, "login")) {
      redirect(buildCleanFlowUrl("/auth/login", flowParams, ["return_to", "lang"]));
    }
    unstable_rethrow(e);
    // flow stays null -> FlowUnavailable renders
  }

  const returnToParam =
    typeof flowParams?.return_to === "string"
      ? `return_to=${encodeURIComponent(flowParams.return_to)}`
      : null;
  const registrationHref = returnToParam
    ? `/auth/registration?${returnToParam}`
    : "/auth/registration";
  const recoveryHref = returnToParam
    ? `/auth/recovery?${returnToParam}`
    : "/auth/recovery";

  const passwordAvailable = flow ? hasPasswordLogin(flow.ui.nodes) : false;
  const providerNodes = flow ? flow.ui.nodes.filter(isProviderNode) : [];
  const socialOnly = flow ? isSocialOnlyLogin(flow.ui.nodes, providerNodes) : false;
  const descriptionKey = socialOnly ? "auth.login.descriptionSocialOnly" : "auth.login.description";

  return (
    <AuthFlowPage
      description={t(descriptionKey)}
      eyebrow={t("auth.login.eyebrow")}
      flow={flow}
      footer={
        <span>
          {isRegistrationEnabled ? (
            <>
              {t("auth.login.footer.needIdentity")}{" "}
              <Link className="font-medium text-primary hover:underline" href={registrationHref}>
                {t("auth.login.footer.createOne")}
              </Link>
              {passwordAvailable ? <span className="mx-2 text-border">/</span> : null}
            </>
          ) : null}
          {passwordAvailable ? (
            <Link className="font-medium text-primary hover:underline" href={recoveryHref}>
              {t("auth.login.footer.recoverAccess")}
            </Link>
          ) : null}
        </span>
      }
      kind="login"
      title={t("auth.login.title")}
    />
  );
}
