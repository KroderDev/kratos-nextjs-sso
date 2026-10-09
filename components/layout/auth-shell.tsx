"use client";

import type { ReactNode } from "react";
import { Fingerprint, ShieldCheck } from "lucide-react";

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
    <div className="min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh lg:grid-cols-[minmax(22rem,0.78fr)_minmax(34rem,1fr)]">
        <aside
          aria-labelledby="auth-shell-title"
          className="relative isolate hidden overflow-hidden bg-secondary px-10 py-10 text-secondary-foreground lg:flex lg:flex-col lg:justify-between xl:px-14"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.1] [background-image:radial-gradient(var(--primary)_1px,transparent_1px)] [background-size:24px_24px]"
          />
          <div className="relative z-10">
            <Brand />
          </div>

          <div className="relative z-10 max-w-md">
            <Badge className="border-secondary-foreground/20 bg-secondary-foreground/10 text-secondary-foreground hover:bg-secondary-foreground/15">
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-primary" />
              {t("auth.shell.badge")}
            </Badge>
            <h2
              className="mt-8 max-w-sm text-4xl font-semibold leading-[1.03] tracking-tighter xl:text-5xl"
              id="auth-shell-title"
            >
              {t("auth.shell.title")}
            </h2>
            <p className="mt-6 max-w-xs text-sm leading-6 text-secondary-foreground/70">
              {t("auth.shell.description")}
            </p>

            <div className="mt-10 grid max-w-md grid-cols-2 overflow-hidden rounded-xl border border-secondary-foreground/15 bg-secondary-foreground/[0.04]">
              <div className="flex flex-col gap-3 border-r border-secondary-foreground/15 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck aria-hidden="true" className="size-4" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
                    {t("auth.shell.sessionLabel")}
                  </span>
                </div>
                <span className="text-xs leading-5 text-secondary-foreground/75">
                  {t("auth.shell.sessionValue")}
                </span>
              </div>
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Fingerprint aria-hidden="true" className="size-4" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
                    {t("auth.shell.boundaryLabel")}
                  </span>
                </div>
                <span className="text-xs leading-5 text-secondary-foreground/75">
                  {t("auth.shell.boundaryValue")}
                </span>
              </div>
            </div>
          </div>

          <p className="relative z-10 font-mono text-[10px] uppercase tracking-[0.18em] text-secondary-foreground/50">
            {t("auth.shell.footerPrivate")}
          </p>
        </aside>

        <main className="flex min-h-svh flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-12 lg:py-10 xl:px-16">
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
            <div className="flex items-center justify-between gap-4">
              <Brand className="lg:hidden" />
              <div className="ml-auto">
                <ThemeToggle />
              </div>
            </div>

            <div className="my-auto py-9 sm:py-12 lg:py-14">{children}</div>

            <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-4 text-[11px] text-muted-foreground sm:pt-5">
              <span className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-3.5 text-primary" />
                {t("auth.shell.footerProtected")}
              </span>
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
    <div className="mx-auto w-full max-w-lg">
      <AuthContentReady />
      <div className="mb-7">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-[2rem] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          {description}
        </p>
      </div>

      {children}

      {footer ? (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function AuthContentLoading() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-lg" aria-label={t("auth.shell.loadingForm")} role="status">
      <div className="mb-7">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-10 w-64 max-w-full" />
        <Skeleton className="mt-4 h-5 w-full max-w-md" />
        <Skeleton className="mt-2 h-5 w-4/5 max-w-sm" />
      </div>
      <Card className="gap-0 border-border/70 bg-card py-0 shadow-lg shadow-foreground/5">
        <CardContent className="flex flex-col gap-5 px-5 py-6 sm:px-7 sm:py-7">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>

      <Skeleton className="mx-auto mt-6 h-4 w-48" />
    </div>
  );
}
