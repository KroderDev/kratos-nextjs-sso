"use client";

import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { brandMark } from "@/lib/branding";
import { useTranslation } from "@/lib/i18n/client";

import { AuthContentReady } from "./auth-content-ready";
import { Brand } from "./brand";

type AuthFrameProps = {
  children: ReactNode;
};

type AuthContentProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthFrame({ children }: AuthFrameProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[minmax(22rem,0.78fr)_minmax(34rem,1fr)]">
        <aside className="relative hidden overflow-hidden bg-secondary px-10 py-10 text-secondary-foreground lg:flex lg:flex-col lg:justify-between xl:px-14">
          <div className="relative z-10">
            <Brand inverted />
          </div>

          <div className="relative z-10 max-w-md">
            <Badge className="border-secondary-foreground/20 bg-secondary-foreground/10 text-secondary-foreground hover:bg-secondary-foreground/15">
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-primary" />
              {t("auth.shell.badge")}
            </Badge>
            <h2 className="mt-8 max-w-sm text-4xl font-semibold leading-[1.03] tracking-[-0.05em] xl:text-5xl">
              {t("auth.shell.title")}
            </h2>
            <p className="mt-6 max-w-xs text-sm leading-6 text-secondary-foreground/70">
              {t("auth.shell.description")}
            </p>

            <div className="mt-10 grid max-w-md gap-3 border-t border-secondary-foreground/15 pt-5 text-xs text-secondary-foreground/70">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                  {t("auth.shell.sessionLabel")}
                </span>
                <span>{t("auth.shell.sessionValue")}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                  {t("auth.shell.boundaryLabel")}
                </span>
                <span>{t("auth.shell.boundaryValue")}</span>
              </div>
            </div>
          </div>

          <p className="relative z-10 font-mono text-[10px] uppercase tracking-[0.18em] text-secondary-foreground/50">
            {t("auth.shell.footerPrivate")}
          </p>
        </aside>

        <main className="flex min-h-screen flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-14 lg:py-12 xl:px-24">
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
            <div className="flex items-center justify-between gap-4">
              <Brand className="lg:hidden" />
              <div className="ml-auto">
                <ThemeToggle />
              </div>
            </div>

            <div className="my-auto py-12 sm:py-16">{children}</div>

            <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-5 text-[11px] text-muted-foreground">
              <span>{t("auth.shell.footerProtected")}</span>
              <span className="font-mono uppercase tracking-[0.16em]">
                {brandMark} / access
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function AuthContent({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthContentProps) {
  return (
    <div>
      <AuthContentReady />
      <div className="mb-8 max-w-lg">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-none tracking-[-0.055em] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
          {description}
        </p>
      </div>

      {children}

      {footer ? (
        <div className="mt-7 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function AuthContentLoading() {
  const { t } = useTranslation();

  return (
    <div className="max-w-lg" aria-label={t("auth.shell.loadingForm")} role="status">
      <div className="mb-8">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-11 w-64 max-w-full" />
        <Skeleton className="mt-5 h-5 w-full max-w-md" />
        <Skeleton className="mt-2 h-5 w-4/5 max-w-sm" />
      </div>
      <Card className="border-border/70 bg-card/85 shadow-xl shadow-foreground/5 backdrop-blur-sm">
        <CardContent className="flex flex-col gap-5 px-6 py-4 sm:px-8 sm:py-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>

      <Skeleton className="mx-auto mt-7 h-4 w-48" />
    </div>
  );
}

