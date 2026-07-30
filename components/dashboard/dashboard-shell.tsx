"use client";

import type { ReactNode } from "react";

import Link from "next/link";

import { AccountMenu } from "@/components/dashboard/account-menu";
import { Brand } from "@/components/layout/brand";
import { DashboardContentReady } from "@/components/layout/dashboard-content-ready";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslation } from "@/lib/i18n/client";

type DashboardShellProps = {
  activeNav: "overview" | "settings";
  children: ReactNode;
  account?: {
    email: string;
    initials: string;
    label: string;
    logoutUrl: string;
  };
};

export function DashboardShell({ activeNav, account, children }: DashboardShellProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardContentReady />
      <header className="border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
          <Brand />
          <nav className="hidden items-center gap-1 text-sm md:flex" aria-label={t("common.navigation.workspace")}>
            <Link
              className={
                activeNav === "overview"
                  ? "rounded-lg bg-muted px-3 py-2 font-medium text-foreground"
                  : "rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              }
              href="/dashboard"
            >
              {t("common.navigation.overview")}
            </Link>
            <Link
              className={
                activeNav === "settings"
                  ? "rounded-lg bg-muted px-3 py-2 font-medium text-foreground"
                  : "rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              }
              href="/dashboard/settings"
            >
              {t("common.navigation.settings")}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {account ? <AccountMenu {...account} /> : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">{children}</main>
    </div>
  );
}

