import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { AuthContent } from "@/components/layout/auth-shell";
import { ConsentForm } from "@/components/ory/consent-form";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/lib/i18n/server";
import { checkKratosSessionStatus } from "@/lib/ory/logout";
import {
  consumeLogoutContinuation,
  LOGOUT_CONTINUATION_COOKIE,
  verifyLogoutContinuationToken,
} from "@/lib/ory/logout-continuation";
import { isOryConfigured } from "@/ory.config";

export const dynamic = "force-dynamic";

/**
 * Generates the localized title for the provider-mediated logout completion page.
 */
export async function generateMetadata() {
  const cookieStore = await cookies();
  const continuation = verifyLogoutContinuationToken(
    cookieStore.get(LOGOUT_CONTINUATION_COOKIE)?.value,
  );
  const { t } = await getTranslations(undefined, continuation?.locale);
  return { title: t("auth.logout.title") };
}

/**
 * Finalizes a provider-mediated logout after confirming that no active Kratos
 * session remains. Renders a native browser POST form targeting only the
 * validated provider `/logout` callback with `transaction` and `csrf` fields.
 */
export default async function LogoutCompletePage() {
  const cookieStore = await cookies();
  const continuation = verifyLogoutContinuationToken(
    cookieStore.get(LOGOUT_CONTINUATION_COOKIE)?.value,
  );

  if (!continuation) {
    redirect("/error?reason=invalid_request");
  }

  if (!isOryConfigured) {
    consumeLogoutContinuation(continuation);
    redirect("/error?reason=logout_unavailable");
  }

  const incomingHeaders = await headers();
  const sessionStatus = await checkKratosSessionStatus(
    incomingHeaders.get("cookie"),
  );

  if (sessionStatus.state !== "no_session") {
    consumeLogoutContinuation(continuation);
    redirect("/error?reason=logout_unavailable");
  }

  if (!consumeLogoutContinuation(continuation)) {
    redirect("/error?reason=invalid_request");
  }

  const { t } = await getTranslations(undefined, continuation.locale);

  return (
    <AuthContent
      description={t("auth.logout.description")}
      title={t("auth.logout.title")}
    >
      <ConsentForm
        action={continuation.providerReturnTo}
        autoSubmit
        className="flex flex-col gap-4 border-t border-border/70 pt-5"
        method="post"
      >
        <input
          name="transaction"
          type="hidden"
          value={continuation.transaction}
        />
        <input name="csrf" type="hidden" value={continuation.csrf} />
        <p className="text-sm leading-6 text-muted-foreground">
          {t("auth.logout.redirecting")}
        </p>
        <Button className="min-h-11 w-full sm:w-auto" type="submit">
          {t("auth.logout.continue")}
        </Button>
      </ConsentForm>
    </AuthContent>
  );
}
