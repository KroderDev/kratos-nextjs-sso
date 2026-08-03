"use client";

import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n/client";

type DashboardLoadingProps = {
  variant?: "overview" | "settings";
};

/**
 * Renders skeleton placeholders for the dashboard overview content.
 */
function OverviewLoadingContent() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="w-full max-w-2xl">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="mt-4 h-12 w-4/5 sm:h-16" />
            <Skeleton className="mt-5 h-5 w-full max-w-xl" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
        <Skeleton className="mt-5 h-56 rounded-xl" />
      </div>

      <aside className="lg:pt-20">
        <div className="border-l border-border pl-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-4 h-6 w-full max-w-56" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-7 h-4 w-28" />
        </div>
      </aside>
    </div>
  );
}

/**
 * Renders a loading skeleton for a settings card.
 */
function SettingsCardLoading() {
  return (
    <div className="overflow-hidden rounded-xl bg-card py-4 text-sm ring-1 ring-foreground/10">
      <div className="border-b border-border/70 px-4 pb-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-4 w-full max-w-sm" />
      </div>
      <div className="flex flex-col gap-5 p-4">
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-10 w-full rounded-md" />
        </div>
        <div>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-10 w-full rounded-md" />
        </div>
      </div>
      <div className="flex border-t bg-muted/50 p-4 sm:justify-end">
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Renders loading placeholders for the dashboard settings page.
 *
 * @returns The settings-page loading content
 */
function SettingsLoadingContent() {
  return (
    <div data-settings-loading="true">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-3 h-10 w-full max-w-xl sm:mt-4 sm:h-16" />
          <Skeleton className="mt-4 h-4 w-full max-w-xl sm:mt-5 sm:h-5" />
          <Skeleton className="mt-2 h-4 w-5/6 max-w-lg sm:h-5" />
        </div>
        <Skeleton className="h-7 w-28 shrink-0 rounded-full" />
      </div>

      <div className="mt-8 grid gap-6 sm:mt-12 sm:gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="hidden flex-col gap-1 lg:flex">
            <Skeleton className="mb-2 h-3 w-28 rounded-sm" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          <div className="min-w-0 overflow-hidden lg:hidden">
            <div className="flex h-6 w-max min-w-full gap-4">
              <Skeleton className="h-6 w-16 rounded-sm" />
              <Skeleton className="h-6 w-20 rounded-sm" />
              <Skeleton className="h-6 w-24 rounded-sm" />
            </div>
          </div>

          <div className="mt-4 border-t border-border/70 pt-4 lg:mt-8 lg:pt-6">
            <div className="hidden flex-col gap-2 lg:flex">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <Skeleton className="mt-3 h-4 w-32 lg:mt-4" />
          </div>
        </aside>

        <section className="min-w-0 max-w-3xl">
          <div className="mb-5 sm:mb-6">
            <Skeleton className="h-3 w-28 rounded-sm" />
            <Skeleton className="mt-2 h-7 w-40 sm:h-8" />
            <Skeleton className="mt-2 h-4 w-full max-w-xl" />
            <Skeleton className="mt-2 h-4 w-5/6 max-w-lg" />
          </div>

          <div className="flex flex-col gap-5">
            <SettingsCardLoading />
            <SettingsCardLoading />
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Displays a loading skeleton for a dashboard page.
 *
 * @param variant - Selects the overview or settings loading content.
 * @returns The dashboard loading interface.
 */
export function DashboardLoading({ variant = "overview" }: DashboardLoadingProps = {}) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground" aria-label={t("dashboard.loading")} role="status">
      <header className="border-b border-border/70 bg-background/85">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
          <Brand />
          <div className="hidden items-center gap-1 md:flex">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
        {variant === "settings" ? <SettingsLoadingContent /> : <OverviewLoadingContent />}
      </main>
    </div>
  );
}
