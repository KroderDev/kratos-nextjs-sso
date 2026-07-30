"use client";

import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n/client";

export function DashboardLoading() {
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
      </main>
    </div>
  );
}
