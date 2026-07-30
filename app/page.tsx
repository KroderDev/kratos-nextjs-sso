import Link from "next/link";
import { ArrowRight, Fingerprint, LockKeyhole, MoveUpRight } from "lucide-react";

import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "@/lib/i18n/server";

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { t } = await getTranslations(searchParams);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <Brand />
        <nav className="flex items-center gap-2 text-sm" aria-label={t("common.navigation.primary")}>
          <ThemeToggle />
          <ButtonLink
            className="hidden sm:inline-flex"
            href="/auth/login"
            size="sm"
            variant="ghost"
          >
            {t("common.navigation.signIn")}
          </ButtonLink>
          <ButtonLink href="/auth/registration" size="sm">
            {t("common.navigation.getStarted")}
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </ButtonLink>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-24 lg:px-10">
        <section className="grid items-end gap-12 pb-20 pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.6fr)] lg:gap-20 lg:pt-24">
          <div>
            <Badge className="gap-2 border-primary/20 bg-primary/5 text-primary" variant="outline">
              <span className="size-1.5 rounded-full bg-primary" />
              {t("home.hero.badge")}
            </Badge>
            <h1 className="mt-7 max-w-4xl text-6xl font-semibold leading-[0.93] tracking-[-0.07em] sm:text-8xl">
              {t("home.hero.title")}
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
              {t("home.hero.description")}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink className="h-11 px-4" href="/auth/login">
                {t("home.hero.enterWorkspace")}
                <ArrowRight aria-hidden="true" data-icon="inline-end" />
              </ButtonLink>
              <ButtonLink
                className="h-11 px-4"
                variant="outline"
                href="/auth/registration"
              >
                {t("home.hero.createIdentity")}
                <MoveUpRight aria-hidden="true" data-icon="inline-end" />
              </ButtonLink>
            </div>
          </div>

          <div className="self-stretch border border-border/70 bg-secondary/45 p-6 text-secondary-foreground sm:p-8 lg:self-auto">
            <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                {t("home.card.tag")}
              </span>
              <span className="size-2 rounded-full bg-primary" />
            </div>
            <p className="mt-10 max-w-xs text-3xl font-semibold leading-[1.05] tracking-[-0.05em]">
              {t("home.card.title")}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
              {t("home.card.description")}
            </p>
            <div className="mt-10 flex items-center gap-3 text-sm font-medium text-primary">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
                <Fingerprint aria-hidden="true" className="size-4" />
              </span>
              {t("home.card.protectedSession")}
            </div>
          </div>
        </section>

        <Separator />

        <section className="grid gap-5 py-16 sm:grid-cols-2 lg:grid-cols-3 lg:py-20">
          <Card className="bg-transparent shadow-none">
            <CardHeader>
              <LockKeyhole aria-hidden="true" className="size-5 text-primary" />
              <CardTitle className="mt-5 text-xl tracking-[-0.03em]">{t("home.features.secureByDefault.title")}</CardTitle>
              <CardDescription>
                {t("home.features.secureByDefault.description")}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-transparent shadow-none">
            <CardHeader>
              <Fingerprint aria-hidden="true" className="size-5 text-primary" />
              <CardTitle className="mt-5 text-xl tracking-[-0.03em]">{t("home.features.humanCenter.title")}</CardTitle>
              <CardDescription>
                {t("home.features.humanCenter.description")}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-transparent shadow-none sm:col-span-2 lg:col-span-1">
            <CardHeader>
              <ArrowRight aria-hidden="true" className="size-5 text-primary" />
              <CardTitle className="mt-5 text-xl tracking-[-0.03em]">{t("home.features.readyNextStep.title")}</CardTitle>
              <CardDescription>
                {t("home.features.readyNextStep.description")}
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="flex flex-col gap-6 border-t border-border/70 pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            {t("common.footer.identityInfrastructure")}
          </p>
          <Link
            className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
            href="/auth/login"
          >
            {t("common.footer.openSignIn")}
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Link>
        </section>
      </main>
    </div>
  );
}

