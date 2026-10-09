import { getServerSession } from "@ory/nextjs/app";
import { redirect } from "next/navigation";

import { AuthContent } from "@/components/layout/auth-shell";
import { ConsentForm } from "@/components/ory/consent-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { consentHandoff } from "@/lib/ory/provider-handoff";
import { getTranslations } from "@/lib/i18n/server";
import { applicationUrl } from "@/lib/ory/url";
import { getConsentScopeTranslationKeys } from "@/lib/ory/consent-scopes";
import { consentRememberMode } from "@/ory.config";

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
    redirect("/error?reason=invalid_request");
  }

  const session = await getServerSession();
  if (!session) {
    const consentSearch = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") {
        consentSearch.set(key, value);
      }
    }
    const consentQs = consentSearch.toString();
    const consentPath = applicationUrl(`/consent?${consentQs}`);
    redirect(`/login?return_to=${encodeURIComponent(consentPath)}`);
  }

  const clientName = handoff.clientName || t("auth.consent.defaultClient");

  return (
    <AuthContent
      description={t("auth.consent.description", { client: clientName })}
      eyebrow={t("auth.consent.eyebrow")}
      title={t("auth.consent.title", { client: clientName })}
    >
      <Card className="gap-0 border-border/70 bg-card py-0 shadow-lg shadow-foreground/5">
        <CardHeader className="border-b border-border/70 px-5 py-5 sm:px-6">
          <CardTitle>{t("auth.consent.permissionsTitle")}</CardTitle>
          <CardDescription>{t("auth.consent.permissionsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="px-5 py-5 sm:px-6 sm:py-6">
          {handoff.scopes.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {handoff.scopes.map((scope, index) => {
                const translationKeys = getConsentScopeTranslationKeys(scope);

                return (
                  <li
                    className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 px-3.5 py-3"
                    key={`${scope}-${index}`}
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                    />
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-foreground">
                        {translationKeys ? t(translationKeys.title) : scope}
                      </p>
                      {translationKeys ? (
                        <p className="mt-0.5 text-xs leading-5 text-muted-foreground sm:text-sm">
                          {t(translationKeys.description)}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-lg border border-border/70 bg-muted/30 px-3.5 py-3 text-sm text-muted-foreground">
              {t("auth.consent.basicAccess")}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <ConsentForm
            action={handoff.providerReturnTo}
            autoSubmit={handoff.skipConsent}
            className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center"
            method="post"
          >
            <input name="transaction" type="hidden" value={handoff.transaction} />
            <input name="csrf" type="hidden" value={handoff.csrf} />
            <input name="decision" type="hidden" value="accept" />
            {handoff.scopes.map((scope) => (
              <input key={scope} name="grant_scope" type="hidden" value={scope} />
            ))}
            {consentRememberMode === "always" ? (
              <input name="remember" type="hidden" value="true" />
            ) : consentRememberMode === "prompt" ? (
              <Field className="w-auto items-center" orientation="horizontal">
                <Checkbox
                  id="consent-remember"
                  name="remember"
                  value="true"
                />
                <FieldLabel
                  className="text-sm text-foreground"
                  htmlFor="consent-remember"
                >
                  {t("auth.consent.remember")}
                </FieldLabel>
              </Field>
            ) : null}
            <Button className="min-h-11 w-full sm:ml-auto sm:w-auto" type="submit">
              {t("auth.consent.allow")}
            </Button>
          </ConsentForm>
          <form action={handoff.providerReturnTo} className="sm:shrink-0" method="post">
            <input name="transaction" type="hidden" value={handoff.transaction} />
            <input name="csrf" type="hidden" value={handoff.csrf} />
            <input name="decision" type="hidden" value="deny" />
            <Button className="min-h-11 w-full sm:w-auto" type="submit" variant="outline">
              {t("auth.consent.deny")}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </AuthContent>
  );
}
