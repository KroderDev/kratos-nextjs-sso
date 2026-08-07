import { redirect } from "next/navigation";

import { AuthContent } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { consentHandoff } from "@/lib/ory/provider-handoff";
import { getTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type ConsentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Generates the localized title for the consent page.
 *
 * @param searchParams - Request parameters used to determine the page locale.
 * @returns The localized consent page metadata.
 */
export async function generateMetadata({ searchParams }: ConsentPageProps) {
  const { t } = await getTranslations(searchParams);
  return { title: t("auth.consent.title", { client: t("auth.consent.defaultClient") }) };
}

/**
 * Renders the localized consent page for an Ory authorization handoff.
 *
 * @param searchParams - Request parameters containing the consent handoff data
 * @returns The consent page, or redirects to the authentication error page for an invalid handoff
 */
export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const { t } = await getTranslations(searchParams);
  const params = await searchParams;
  const handoff = consentHandoff(params);

  if (!handoff) {
    redirect("/auth/error?reason=invalid_request");
  }

  const clientName = handoff.clientName || t("auth.consent.defaultClient");

  return (
    <AuthContent
      description={t("auth.consent.description", { client: clientName })}
      eyebrow={t("auth.consent.eyebrow")}
      title={t("auth.consent.title", { client: clientName })}
    >
      <Card className="border-border/70 bg-card/85 shadow-xl shadow-foreground/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>{t("auth.consent.permissionsTitle")}</CardTitle>
          <CardDescription>{t("auth.consent.permissionsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {handoff.scopes.length > 0 ? (
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {handoff.scopes.map((scope) => (
                <li key={scope}>{scope}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("auth.consent.basicAccess")}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
          <form action={handoff.providerReturnTo} method="post">
            <input name="transaction" type="hidden" value={handoff.transaction} />
            <input name="csrf" type="hidden" value={handoff.csrf} />
            <input name="decision" type="hidden" value="accept" />
            {handoff.scopes.map((scope) => (
              <input key={scope} name="grant_scope" type="hidden" value={scope} />
            ))}
            <Button className="w-full sm:w-auto" type="submit">
              {t("auth.consent.allow")}
            </Button>
          </form>
          {!handoff.skipConsent ? (
            <form action={handoff.providerReturnTo} method="post">
              <input name="transaction" type="hidden" value={handoff.transaction} />
              <input name="csrf" type="hidden" value={handoff.csrf} />
              <input name="decision" type="hidden" value="deny" />
              <Button className="w-full sm:w-auto" type="submit" variant="outline">
                {t("auth.consent.deny")}
              </Button>
            </form>
          ) : null}
        </CardFooter>
      </Card>
    </AuthContent>
  );
}
