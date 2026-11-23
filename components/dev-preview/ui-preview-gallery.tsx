"use client";

import { useState, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";

import type { AccountMenuAction } from "@/components/dashboard/account-menu";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AuthFrame } from "@/components/layout/auth-shell";
import { AuthFlowPage } from "@/components/ory/auth-flow-page";
import { SettingsNavigation } from "@/components/ory/settings-navigation";
import {
  getSettingsAreaDefinition,
  SETTINGS_AREA_DEFINITIONS,
  type SettingsArea,
} from "@/components/ory/settings-sections";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { hasPasswordLogin } from "@/lib/ory/flow";
import { useTranslation } from "@/lib/i18n/client";

import { getAuthPreviewFooterPlan } from "./auth-preview-footer";
import {
  PREVIEW_AUTH_SCENARIOS,
  type PreviewAuthScenarioId,
} from "./flow-fixtures";

type PreviewSection = "menus" | "authentication";

export function UiPreviewGallery() {
  const { t } = useTranslation();
  const [section, setSection] = useState<PreviewSection>("menus");
  const [scenarioId, setScenarioId] = useState<PreviewAuthScenarioId>("registration");
  const scenario = PREVIEW_AUTH_SCENARIOS.find((item) => item.id === scenarioId)!;

  return (
    <main className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2.5 sm:px-6">
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <div
              aria-label={t("devPreview.title")}
              className="flex rounded-lg border border-border/70 bg-muted/35 p-1"
              role="group"
            >
              <Button
                aria-pressed={section === "menus"}
                className="h-8 px-2 text-[11px] sm:px-2.5 sm:text-xs"
                onClick={() => setSection("menus")}
                size="sm"
                type="button"
                variant={section === "menus" ? "default" : "outline"}
              >
                {t("devPreview.menus")}
              </Button>
              <Button
                aria-pressed={section === "authentication"}
                className="h-8 px-2 text-[11px] sm:px-2.5 sm:text-xs"
                onClick={() => setSection("authentication")}
                size="sm"
                type="button"
                variant={section === "authentication" ? "default" : "outline"}
              >
                {t("devPreview.authentication")}
              </Button>
            </div>
            {section === "authentication" ? (
              <div className="flex items-center gap-2">
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:inline">
                  {t("devPreview.scenario")}
                </span>
                <NativeSelect
                  aria-label={t("devPreview.authenticationTitle")}
                  className="w-36 sm:w-44"
                  onChange={(event) => {
                    const nextScenario = PREVIEW_AUTH_SCENARIOS.find(
                      (item) => item.id === event.currentTarget.value,
                    );
                    if (nextScenario) {
                      setScenarioId(nextScenario.id);
                    }
                  }}
                  size="sm"
                  value={scenarioId}
                >
                  {PREVIEW_AUTH_SCENARIOS.map((item) => (
                    <NativeSelectOption key={item.id} value={item.id}>
                      {t(item.labelKey)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {section === "menus" ? (
        <MenusPreview />
      ) : (
        <AuthenticationPreview key={scenarioId} scenario={scenario} />
      )}
    </main>
  );
}

function MenusPreview() {
  const { t } = useTranslation();
  const [activeNav, setActiveNav] = useState<"overview" | "settings">("overview");
  const [activeArea, setActiveArea] = useState<SettingsArea>("profile");
  const [notice, setNotice] = useState("");
  const selectedArea = getSettingsAreaDefinition(activeArea);

  function handleWorkspaceClick(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) {
      return;
    }

    const link = event.target.closest("a");
    if (!link || link.closest("[data-preview-settings-navigation]")) {
      return;
    }

    event.preventDefault();
    const href = link.getAttribute("href");

    if (href === "/dashboard") {
      setActiveNav("overview");
      return;
    }

    if (href?.startsWith("/dashboard/settings")) {
      setActiveNav("settings");
      return;
    }

    setNotice(t("devPreview.navigationBlocked"));
  }

  function handleAccountAction(action: AccountMenuAction) {
    if (action === "settings") {
      setActiveNav("settings");
      return;
    }

    setNotice(t("devPreview.signOutBlocked"));
  }

  return (
    <div onClickCapture={handleWorkspaceClick}>
      <DashboardShell
        activeNav={activeNav}
        account={{
          email: t("devPreview.accountEmail"),
          initials: "DU",
          label: t("devPreview.accountName"),
          logoutUrl: "#preview-sign-out",
        }}
        onAccountAction={handleAccountAction}
      >
        <div className="mb-8">
          <h2 className="text-xl font-semibold tracking-tight">{t("devPreview.workspaceTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("devPreview.workspaceDescription")}
          </p>
          {notice ? (
            <p className="mt-3 text-sm text-muted-foreground" role="status">
              {notice}
            </p>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
          <aside className="min-w-0 lg:sticky lg:top-8 lg:self-start">
            <p className="mb-3 px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("devPreview.settingsTitle")}
            </p>
            <div data-preview-settings-navigation>
              <SettingsNavigation
                activeArea={activeArea}
                areas={SETTINGS_AREA_DEFINITIONS}
                onAreaChange={setActiveArea}
                persistSelection={false}
              />
            </div>
          </aside>

          <section aria-labelledby="preview-settings-area" className="min-w-0 max-w-3xl">
            <Card>
              <CardHeader>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                  {t("devPreview.currentArea")}
                </p>
                <CardTitle id="preview-settings-area">{t(selectedArea.label)}</CardTitle>
                <CardDescription>{t(selectedArea.description)}</CardDescription>
              </CardHeader>
              <CardContent>
                <Card className="bg-muted/35 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">{t("devPreview.workspaceCardTitle")}</CardTitle>
                    <CardDescription>{t("devPreview.workspaceCardDescription")}</CardDescription>
                  </CardHeader>
                </Card>
              </CardContent>
            </Card>
          </section>
        </div>
      </DashboardShell>
    </div>
  );
}

function AuthenticationPreview({
  scenario,
}: {
  scenario: (typeof PREVIEW_AUTH_SCENARIOS)[number];
}) {
  const { t } = useTranslation();
  const [notice, setNotice] = useState("");
  const isEmailSentStatus =
    (scenario.kind === "recovery" || scenario.kind === "verification") &&
    scenario.flow.state === "sent_email";
  const emailSentTitle =
    isEmailSentStatus
      ? t(
          scenario.kind === "recovery"
            ? "auth.recovery.emailSentTitle"
            : "auth.verification.emailSentTitle",
        )
      : undefined;

  function preventSubmission(event: FormEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLFormElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setNotice(t("devPreview.formSubmitBlocked"));
  }

  function preventActionClick(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) {
      return;
    }

    const previewNavigation = event.target.closest("a[data-preview-navigation]");
    if (previewNavigation) {
      event.preventDefault();
      event.stopPropagation();
      setNotice(t("devPreview.navigationBlocked"));
      return;
    }

    const action = event.target.closest(
      'form button[type="submit"], form button[type="button"], form input[type="submit"], form input[type="button"], form input[type="image"]',
    );

    if (action) {
      event.preventDefault();
      event.stopPropagation();
      setNotice(t("devPreview.formSubmitBlocked"));
      return;
    }
  }

  const footerPlan = getAuthPreviewFooterPlan({
    kind: scenario.kind,
    passwordAvailable: hasPasswordLogin(scenario.flow.ui.nodes),
    registrationEnabled: process.env.NEXT_PUBLIC_ORY_REGISTRATION_ENABLED !== "false",
    isEmailSentStatus,
  });
  const footer = footerPlan ? (
    <span>
      {footerPlan.introKey ? <>{t(footerPlan.introKey)}{" "}</> : null}
      {footerPlan.links.map((link) => (
        <span key={link.href}>
          {link.separatorBefore ? (
            <span aria-hidden="true" className="mx-2 text-border">/</span>
          ) : null}
          <Link
            className="font-medium text-primary hover:underline"
            data-preview-navigation
            href={link.href}
            prefetch={false}
          >
            {t(link.labelKey)}
          </Link>
        </span>
      ))}
    </span>
  ) : undefined;
  const statusAction = isEmailSentStatus ? (
    <ButtonLink
      className="w-full"
      data-preview-navigation
      href="/login"
      prefetch={false}
    >
      {t(
        scenario.kind === "recovery"
          ? "auth.recovery.footer.returnSignIn"
          : "auth.verification.footer.returnSignIn",
      )}
    </ButtonLink>
  ) : undefined;

  return (
    <div>
      {notice ? (
        <p className="mx-auto max-w-7xl px-4 py-2 text-sm text-muted-foreground sm:px-6" role="status">
          {notice}
        </p>
      ) : null}

      <div onClickCapture={preventActionClick} onSubmitCapture={preventSubmission}>
        <AuthFrame>
          <AuthFlowPage
            description={t(scenario.descriptionKey)}
            emailSentTitle={emailSentTitle}
            flow={scenario.flow}
            footer={footer}
            kind={scenario.kind}
            statusAction={statusAction}
            title={t(scenario.titleKey)}
          />
        </AuthFrame>
      </div>
    </div>
  );
}
