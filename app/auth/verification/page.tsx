import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { getVerificationFlow, type OryPageParams } from "@ory/nextjs/app";

import { AuthContent } from "@/components/layout/auth-shell";
import { AuthFlowPage } from "@/components/ory/auth-flow-page";
import { OrySetupState } from "@/components/ory/setup-state";
import { rewriteOryFlow } from "@/lib/ory/url";
import config, { isOryConfigured } from "@/ory.config";
import { getTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  return { title: t("auth.verification.eyebrow") };
}

export default async function VerificationPage({
  searchParams,
}: OryPageParams) {
  const { t } = await getTranslations(searchParams);

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
      rewriteOryFlow(await getVerificationFlow(config, searchParams)) || null;
  } catch (e) {
    unstable_rethrow(e);
    // flow stays null → FlowUnavailable renders
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

