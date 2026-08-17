import { AuthContent } from "@/components/layout/auth-shell";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  getKnownOryErrorMessage,
  getOryFlowError,
  getOryFlowErrorMessage,
} from "@/lib/ory/error";
import { isOryConfigured } from "@/ory.config";
import { CircleAlert } from "lucide-react";
import { getTranslations } from "@/lib/i18n/server";

type ErrorPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: ErrorPageProps) {
  const { t } = await getTranslations(searchParams);
  return { title: t("auth.error.eyebrow") };
}

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const { t } = await getTranslations(searchParams);
  const params = await searchParams;
  const errorId = typeof params.id === "string" ? params.id : undefined;
  const flowError =
    isOryConfigured && errorId ? await getOryFlowError(errorId) : null;
  const reason = typeof params.reason === "string" ? params.reason : undefined;
  const errorMessage =
    getOryFlowErrorMessage(flowError) ?? getKnownOryErrorMessage(reason, t);

  return (
    <AuthContent
      description={t("auth.error.description")}
      eyebrow={t("auth.error.eyebrow")}
      title={t("auth.error.title")}
    >
      <Alert className="border-destructive/25 bg-destructive/5" variant="destructive">
        <CircleAlert aria-hidden="true" />
        <AlertTitle>{t("auth.error.alertTitle")}</AlertTitle>
        <AlertDescription className="mt-2 flex flex-col gap-4">
          <p>
            {errorMessage ?? t("auth.error.fallbackMessage")}
          </p>
          <ButtonLink className="w-fit" href="/login">
            {t("auth.error.backToSignIn")}
          </ButtonLink>
        </AlertDescription>
      </Alert>
    </AuthContent>
  );
}
