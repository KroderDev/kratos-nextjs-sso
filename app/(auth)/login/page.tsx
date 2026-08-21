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

/**
 * Selects localized title and description keys for the login page based on authentication context.
 *
 * @param params - Request parameters that may indicate an AAL2 or refresh login request.
 * @param socialOnly - Whether the login page is limited to social providers.
 * @returns The localized title and description keys for the login context.
 */
export function getLoginContext(
  params: Record<string, string | string[] | undefined>,
  socialOnly = false,
) {
  if (params.aal === "aal2") {
    return {
      descriptionKey: "auth.login.descriptionAal2",
      titleKey: "auth.login.titleAal2",
    };
  }

  if (params.refresh === "true") {
    return {
      descriptionKey: "auth.login.descriptionRefresh",
      titleKey: "auth.login.titleRefresh",
    };
  }

  return {
    descriptionKey: socialOnly ? "auth.login.descriptionSocialOnly" : "auth.login.description",
    titleKey: "auth.login.title",
  };
}

/**
 * Generates the localized title metadata for the login page.
 *
 * @returns Metadata containing the localized login page title.
 */
export async function generateMetadata({ searchParams }: OryPageParams) {
  const params = await searchParams;
  const { t } = await getTranslations(params);
  return { title: t(getLoginContext(params).titleKey) };
}

/**
 * Renders the localized login page with setup, authentication, or unavailable-flow state.
 *
 * @param searchParams - Request parameters used to load translations and determine the login flow.
 */
export default async function LoginPage({ searchParams }: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  const params = await searchParams;
  const initialLoginContext = getLoginContext(params);

  if (params.flow === "logout") {
    redirect(buildCleanFlowUrl("/logout", params, ["flow", "transaction", "csrf", "return_to"]));
  }

  const flowParams = providerLoginParams(params);

  if (!flowParams && isProviderHandoff(params)) {
    redirect("/error?reason=invalid_request");
  }

  if (!isOryConfigured) {
    return (
      <AuthContent
        description={t(initialLoginContext.descriptionKey)}
        eyebrow={t("auth.login.eyebrow")}
        footer={
          <span>
            {t("auth.login.footer.needIdentity")}{" "}
            <Link className="font-medium text-primary hover:underline" href="/registration">
              {t("auth.login.footer.createOne")}
            </Link>
          </span>
        }
        title={t(initialLoginContext.titleKey)}
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
      redirect(buildCleanFlowUrl("/login", flowParams, ["return_to", "lang"]));
    }
    unstable_rethrow(e);
    // flow stays null -> FlowUnavailable renders
  }

  const returnToParam =
    typeof flowParams?.return_to === "string"
      ? `return_to=${encodeURIComponent(flowParams.return_to)}`
      : null;
  const registrationHref = returnToParam
    ? `/registration?${returnToParam}`
    : "/registration";
  const recoveryHref = returnToParam
    ? `/recovery?${returnToParam}`
    : "/recovery";

  const passwordAvailable = flow ? hasPasswordLogin(flow.ui.nodes) : false;
  const providerNodes = flow ? flow.ui.nodes.filter(isProviderNode) : [];
  const socialOnly = flow ? isSocialOnlyLogin(flow.ui.nodes, providerNodes) : false;
  const loginContext = getLoginContext(params, socialOnly);

  return (
    <AuthFlowPage
      description={t(loginContext.descriptionKey)}
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
      title={t(loginContext.titleKey)}
    />
  );
}
