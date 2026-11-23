"use client";

import type { ReactNode } from "react";
import { Fingerprint, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { privacyPolicyUrl, termsOfServiceUrl } from "@/lib/legal";
import { useTranslation } from "@/lib/i18n/client";

import { AuthContentReady } from "./auth-content-ready";
import { Brand } from "./brand";

type AuthFrameProps = {
  children: ReactNode;
};

type AuthContentProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  statusIcon?: ReactNode;
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
          </div>
        </main>
      </div>
    </div>
  );
}

export function AuthContent({
  title,
  description,
  children,
  footer,
  statusIcon,
}: AuthContentProps) {
  return (
    <div className="mx-auto w-full max-w-lg">
      <AuthContentReady />
      <Card className="gap-0 border-border/70 bg-card py-0 shadow-lg shadow-foreground/5">
        <CardHeader className="items-center gap-3 px-5 pt-6 text-center sm:px-7 sm:pt-7">
          {statusIcon}
          <h1 className="text-center text-2xl font-semibold leading-tight tracking-tight sm:text-[1.75rem]">
            {title}
          </h1>
          {description ? (
            <CardDescription className="max-w-md text-center text-sm leading-6 sm:text-base sm:leading-7">
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>

        <CardContent className="flex flex-col gap-5 px-5 pb-6 sm:px-7 sm:pb-7">
          {children}
        </CardContent>

        {footer ? (
          <CardFooter className="justify-center px-5 py-4 text-center text-sm text-muted-foreground sm:px-7">
            {footer}
          </CardFooter>
        ) : null}
      </Card>
      <AuthLegalLinks />
    </div>
  );
}

export function AuthLegalLinks() {
  const { t } = useTranslation();

  return (
    <p
      className="mx-auto mt-4 flex max-w-md flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs leading-5 text-muted-foreground"
      data-slot="auth-legal-links"
    >
      {termsOfServiceUrl ? (
        <Link className="underline underline-offset-4 hover:text-foreground" href={termsOfServiceUrl}>
          {t("auth.legal.terms")}
        </Link>
      ) : (
        <span>{t("auth.legal.terms")}</span>
      )}{" "}
      <span aria-hidden="true">·</span>
      {privacyPolicyUrl ? (
        <Link className="underline underline-offset-4 hover:text-foreground" href={privacyPolicyUrl}>
          {t("auth.legal.privacy")}
        </Link>
      ) : (
        <span>{t("auth.legal.privacy")}</span>
      )}
    </p>
  );
}

export function AuthContentLoading() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col">
      <div aria-label={t("auth.shell.loadingForm")} role="status">
        <Card className="gap-0 border-border/70 bg-card py-0 shadow-lg shadow-foreground/5">
          <CardHeader className="items-center gap-3 px-5 pt-6 sm:px-7 sm:pt-7">
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-5 w-full max-w-md" />
            <Skeleton className="h-5 w-4/5 max-w-sm" />
          </CardHeader>
          <CardContent className="flex flex-col gap-5 px-5 pb-6 sm:px-7 sm:pb-7">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      </div>
      <AuthLegalLinks />
    </div>
  );
}
