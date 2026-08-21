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
          <ConsentForm
            action={handoff.providerReturnTo}
            autoSubmit={handoff.skipConsent}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
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
                  className="text-muted-foreground"
                  htmlFor="consent-remember"
                >
                  {t("auth.consent.remember")}
                </FieldLabel>
              </Field>
            ) : null}
            <Button className="w-full sm:w-auto" type="submit">
              {t("auth.consent.allow")}
            </Button>
          </ConsentForm>
          <form action={handoff.providerReturnTo} method="post">
            <input name="transaction" type="hidden" value={handoff.transaction} />
            <input name="csrf" type="hidden" value={handoff.csrf} />
            <input name="decision" type="hidden" value="deny" />
            <Button className="w-full sm:w-auto" type="submit" variant="outline">
              {t("auth.consent.deny")}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </AuthContent>
  );
}
