import Link from "next/link";
import { getServerSession, getSettingsFlow, type OryPageParams } from "@ory/nextjs/app";
import { getSafeLogoutFlow } from "@/lib/ory/logout";
import { redirect, unstable_rethrow } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FlowForm } from "@/components/ory/flow-form";
import { FlowUnavailable } from "@/components/ory/flow-unavailable";
import { OrySetupState } from "@/components/ory/setup-state";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowUpRight } from "lucide-react";
import {
  getIdentityEmail,
  getIdentityInitials,
  getIdentityName,
} from "@/lib/ory/identity";
import { rewriteOryFlow } from "@/lib/ory/url";
import { isOryFlowRestartRedirect } from "@/lib/ory/redirect";
import config, { appBaseUrl, isOryConfigured } from "@/ory.config";
import { getTranslations } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  return { title: t("common.navigation.settings") };
}

function SettingsIntro({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          {t("dashboard.settings.eyebrow")}
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-6xl">
          {t("dashboard.settings.title")}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
          {t("dashboard.settings.description")}
        </p>
      </div>
      <Badge className="gap-2 border-primary/20 bg-primary/5 text-primary" variant="outline">
        <span className="size-1.5 rounded-full bg-primary" />
        {t("dashboard.settings.badge")}
      </Badge>
    </div>
  );
}

function SettingsAside({ t }: { t: (key: string) => string }) {
  return (
    <aside className="lg:pt-20">
      <div className="border-l border-border pl-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          {t("dashboard.settings.aside.tag")}
        </p>
        <p className="mt-4 text-lg font-medium leading-6 tracking-[-0.02em]">
          {t("dashboard.settings.aside.title")}
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t("dashboard.settings.aside.description")}
        </p>
        <ButtonLink className="mt-6" href="/dashboard" size="sm" variant="link">
          {t("dashboard.settings.aside.returnOverview")}
          <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
        </ButtonLink>
      </div>
    </aside>
  );
}

export default async function SettingsPage({ searchParams }: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  const params = await searchParams;

  if (!isOryConfigured) {
    return (
      <DashboardShell activeNav="settings">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
          <div>
            <SettingsIntro t={t} />
            <div className="mt-12 max-w-3xl">
              <OrySetupState />
            </div>
          </div>
          <SettingsAside t={t} />
        </div>
      </DashboardShell>
    );
  }

  const session = await getServerSession();

  if (!session?.identity) {
    redirect("/auth/login?return_to=/dashboard/settings");
  }

  const identity = session.identity;
  const name = getIdentityName(identity);
  const logoutFlow = await getSafeLogoutFlow(appBaseUrl);
  let flow = null;

  try {
    flow = rewriteOryFlow(await getSettingsFlow(config, params)) || null;
  } catch (e) {
    if (typeof params.flow === "string" && isOryFlowRestartRedirect(e, "settings")) {
      redirect("/dashboard/settings");
    }
    unstable_rethrow(e);
    // flow stays null -> FlowUnavailable renders
  }

  return (
    <DashboardShell
      activeNav="settings"
      account={{
        email: getIdentityEmail(identity),
        initials: getIdentityInitials(identity),
        label: name,
        logoutUrl: logoutFlow.logout_url,
      }}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
        <div>
          <SettingsIntro t={t} />
          <div className="mt-12 max-w-3xl">
            {flow ? <FlowForm embedded flow={flow} kind="settings" /> : <FlowUnavailable />}
            <div className="mt-7 text-center text-sm text-muted-foreground">
              <Link className="font-medium text-primary hover:underline" href="/dashboard">
                {t("dashboard.settings.returnOverview")}
              </Link>
            </div>
          </div>
        </div>
        <SettingsAside t={t} />
      </div>
    </DashboardShell>
  );
}
