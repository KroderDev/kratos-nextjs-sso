import { getServerSession, type OryPageParams } from "@ory/nextjs/app";
import { cookies } from "next/headers";
import { getSafeLogoutFlow } from "@/lib/ory/logout";
import { redirect, unstable_rethrow } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FlowUnavailable } from "@/components/ory/flow-unavailable";
import { SettingsWorkspace } from "@/components/ory/settings-workspace";
import { getSettingsArea } from "@/components/ory/settings-sections";
import { OrySetupState } from "@/components/ory/setup-state";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowUpRight } from "lucide-react";
import {
  getIdentityAvatarUrl,
  getIdentityEmail,
  getIdentityInitials,
  getIdentityName,
} from "@/lib/ory/identity";
import { isValidLocale } from "@/lib/i18n/config";
import { rewriteOryFlow } from "@/lib/ory/url";
import { isOryFlowRestartRedirect } from "@/lib/ory/redirect";
import { buildCleanFlowUrl } from "@/lib/ory/params";
import { SETTINGS_AREA_COOKIE } from "@/lib/ory/settings-state";
import { toRenderableOryFlow } from "@/lib/ory/types";
import { appBaseUrl, isOryConfigured } from "@/ory.config";
import { getTranslations } from "@/lib/i18n/server";
import { getSettingsFlowWithRequestHeaders } from "@/lib/ory/flow-request";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  return { title: t("common.navigation.settings") };
}

/**
 * Renders the localized settings page introduction and status badge.
 *
 * @param t - Translation function used to retrieve the displayed text
 */
function SettingsIntro({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          {t("dashboard.settings.eyebrow")}
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-[1.04] tracking-[-0.05em] sm:mt-4 sm:text-6xl sm:tracking-[-0.055em]">
          {t("dashboard.settings.title")}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:mt-5 sm:text-base sm:leading-7">
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

/**
 * Renders the localized account settings page and its active settings workspace.
 *
 * Displays setup guidance when Ory is not configured, redirects unauthenticated users to login, and shows an unavailable state when the settings flow cannot be loaded.
 *
 * @param searchParams - URL parameters that select the settings section and locale and identify the settings flow
 */
export default async function SettingsPage({ searchParams }: OryPageParams) {
  const { t } = await getTranslations(searchParams);
  const params = await searchParams;
  const requestedArea = getSettingsArea(params.section);
  const requestedLocale =
    typeof params.lang === "string" && isValidLocale(params.lang) ? params.lang : undefined;

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
    redirect(
      buildCleanFlowUrl(
        "/login",
        { return_to: "/dashboard/settings" },
        ["return_to"],
      ),
    );
  }

  const identity = session.identity;
  const cookieStore = await cookies();
  const rememberedArea = getSettingsArea(cookieStore.get(SETTINGS_AREA_COOKIE)?.value);
  const activeArea = requestedArea ?? rememberedArea ?? "profile";

  if (!requestedArea && rememberedArea) {
    redirect(
      buildCleanFlowUrl(
        "/dashboard/settings",
        { ...params, section: rememberedArea },
        ["flow", "lang", "section"],
      ),
    );
  }

  const name = getIdentityName(identity);
  const logoutFlow = await getSafeLogoutFlow(appBaseUrl);
  let flow = null;

  try {
    flow = rewriteOryFlow(await getSettingsFlowWithRequestHeaders(params)) || null;
  } catch (e) {
    if (typeof params.flow === "string" && isOryFlowRestartRedirect(e, "settings")) {
      redirect(buildCleanFlowUrl("/dashboard/settings", params, ["lang", "section"]));
    }
    unstable_rethrow(e);
    // flow stays null -> FlowUnavailable renders
  }

  return (
    <DashboardShell
      activeNav="settings"
      account={{
        avatarUrl: getIdentityAvatarUrl(identity),
        email: getIdentityEmail(identity),
        initials: getIdentityInitials(identity),
        label: name,
        logoutUrl: logoutFlow.logout_url,
      }}
    >
      <SettingsIntro t={t} />
      <div className="mt-8 sm:mt-12">
        {flow ? (
          <SettingsWorkspace
            flow={toRenderableOryFlow(flow)}
            flowState={flow.state}
            initialArea={activeArea}
            locale={requestedLocale}
          />
        ) : (
          <div className="max-w-3xl">
            <FlowUnavailable />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
