import { getServerSession } from "@ory/nextjs/app";
import { getSafeLogoutFlow } from "@/lib/ory/logout";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  Clock3,
  Fingerprint,
  ShieldCheck,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OrySetupState } from "@/components/ory/setup-state";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getIdentityEmail,
  getIdentityInitials,
  getIdentityName,
} from "@/lib/ory/identity";
import { appBaseUrl, isOryConfigured } from "@/ory.config";
import { getTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: DashboardPageProps) {
  const { t } = await getTranslations(searchParams);
  return { title: t("common.navigation.overview") };
}

function formatDate(value: Date | undefined, locale: string, notAvailableText: string) {
  if (!value) {
    return notAvailableText;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { t, locale } = await getTranslations(searchParams);

  if (!isOryConfigured) {
    return (
      <DashboardShell activeNav="overview">
        <div className="min-h-[calc(100vh-12rem)] max-w-xl py-16">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              {t("dashboard.overview.unconfigured.eyebrow")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
              {t("dashboard.overview.unconfigured.title")}
            </h1>
            <p className="mt-5 text-muted-foreground">
              {t("dashboard.overview.unconfigured.description")}
            </p>
            <div className="mt-8 max-w-lg">
              <OrySetupState />
            </div>
        </div>
      </DashboardShell>
    );
  }

  const session = await getServerSession();

  if (!session?.identity) {
    redirect("/auth/login?return_to=/dashboard");
  }

  const identity = session.identity;
  const name = getIdentityName(identity);
  const email = getIdentityEmail(identity);
  const logoutFlow = await getSafeLogoutFlow(appBaseUrl);

  return (
    <DashboardShell
      activeNav="overview"
      account={{
        email,
        initials: getIdentityInitials(identity),
        label: name,
        logoutUrl: logoutFlow.logout_url,
      }}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  {t("dashboard.overview.eyebrow")}
                </p>
                <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-6xl">
                  {t("dashboard.overview.title", { name: name.split(" ")[0] })}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                  {t("dashboard.overview.description")}
                </p>
              </div>
              <Badge className="gap-2 border-primary/20 bg-primary/5 text-primary" variant="outline">
                <span className="size-1.5 rounded-full bg-primary" />
                {t("dashboard.overview.sessionActive")}
              </Badge>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <Card className="bg-primary text-primary-foreground shadow-lg shadow-primary/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Fingerprint aria-hidden="true" className="size-5" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary-foreground/55">
                      {t("dashboard.overview.identityCard.tag")}
                    </span>
                  </div>
                  <CardTitle className="mt-7 text-2xl tracking-[-0.04em]">
                    {t("dashboard.overview.identityCard.title")}
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/65">
                    {t("dashboard.overview.identityCard.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                    <Check aria-hidden="true" data-icon="inline-start" />
                    {t("dashboard.overview.identityCard.established")}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {t("dashboard.overview.postureCard.tag")}
                    </span>
                  </div>
                  <CardTitle className="mt-7 text-2xl tracking-[-0.04em]">
                    {t("dashboard.overview.postureCard.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("dashboard.overview.postureCard.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ButtonLink href="/dashboard/settings" size="sm" variant="link">
                    {t("dashboard.overview.postureCard.reviewSettings")}
                    <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
                  </ButtonLink>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-5">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl tracking-[-0.03em]">{t("dashboard.overview.sessionDetails.title")}</CardTitle>
                    <CardDescription className="mt-1">
                      {t("dashboard.overview.sessionDetails.description")}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{t("dashboard.overview.sessionDetails.serverChecked")}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {t("dashboard.overview.sessionDetails.email")}
                    </p>
                    <p className="mt-2 truncate text-sm font-medium">{email}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {t("dashboard.overview.sessionDetails.issued")}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-medium">
                      <Clock3 aria-hidden="true" data-icon="inline-start" />
                      {formatDate(session.issued_at, locale, t("dashboard.overview.sessionDetails.notAvailable"))}
                    </p>
                  </div>
                </div>
                <Separator className="my-6" />
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">session/{session.id.slice(0, 8)}</span>
                  <span>
                    {t("dashboard.overview.sessionDetails.expires", {
                      date: formatDate(session.expires_at, locale, t("dashboard.overview.sessionDetails.notAvailable")),
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="lg:pt-20">
            <div className="border-l border-border pl-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                {t("dashboard.overview.aside.tag")}
              </p>
              <p className="mt-4 text-lg font-medium leading-6 tracking-[-0.02em]">
                {t("dashboard.overview.aside.title")}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("dashboard.overview.aside.description")}
              </p>
              <ButtonLink className="mt-6" href="/dashboard/settings" size="sm" variant="link">
                {t("dashboard.overview.aside.openSettings")}
                <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
              </ButtonLink>
            </div>
          </aside>
      </div>
    </DashboardShell>
  );
}

