import Link from "next/link";
import { ArrowRight, Fingerprint, LockKeyhole, MoveUpRight } from "lucide-react";

import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <Brand />
        <nav className="flex items-center gap-2 text-sm" aria-label="Primary">
          <Link
            className="hidden rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            href="/auth/login"
          >
            Sign in
          </Link>
          <ButtonLink href="/auth/registration" size="sm">
            Get started
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </ButtonLink>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-24 lg:px-10">
        <section className="grid items-end gap-12 pb-20 pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.6fr)] lg:gap-20 lg:pt-24">
          <div>
            <Badge className="gap-2 border-primary/20 bg-primary/5 text-primary" variant="outline">
              <span className="size-1.5 rounded-full bg-signal" />
              Secure account access
            </Badge>
            <h1 className="mt-7 max-w-4xl text-6xl font-semibold leading-[0.93] tracking-[-0.07em] sm:text-8xl">
              A calmer way to enter the work.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
              A considered, server-rendered entry point for sign-in, registration,
              recovery, and account settings.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink className="h-11 px-4" href="/auth/login">
                Enter your workspace
                <ArrowRight aria-hidden="true" data-icon="inline-end" />
              </ButtonLink>
              <ButtonLink
                className="h-11 px-4"
                variant="outline"
                href="/auth/registration"
              >
                Create an identity
                <MoveUpRight aria-hidden="true" data-icon="inline-end" />
              </ButtonLink>
            </div>
          </div>

          <div className="relative min-h-64 overflow-hidden rounded-2xl border border-border/70 bg-foreground p-6 text-background shadow-2xl shadow-foreground/10 sm:p-8">
            <div className="signal-grid pointer-events-none absolute inset-0 opacity-50" />
            <div className="signal-orbit pointer-events-none absolute -right-24 -bottom-28 size-72 rounded-full border border-background/20" />
            <div className="relative flex h-full flex-col justify-between gap-12">
              <div className="flex items-center justify-between">
                <Fingerprint aria-hidden="true" className="size-6 text-signal" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/50">
                  entry / 01
                </span>
              </div>
              <div>
                <p className="text-3xl font-semibold tracking-[-0.05em]">Clear signal.</p>
                <p className="mt-3 max-w-xs text-sm leading-6 text-background/60">
                  No noise between a person and the private work they are here
                  to do.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        <section className="grid gap-5 py-16 sm:grid-cols-2 lg:grid-cols-3 lg:py-20">
          <Card className="bg-transparent shadow-none">
            <CardHeader>
              <LockKeyhole aria-hidden="true" className="size-5 text-primary" />
              <CardTitle className="mt-5 text-xl tracking-[-0.03em]">Secure by default</CardTitle>
              <CardDescription>
                Security controls keep cookies, redirects, and session state close
                to the server boundary.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-transparent shadow-none">
            <CardHeader>
              <Fingerprint aria-hidden="true" className="size-5 text-primary" />
              <CardTitle className="mt-5 text-xl tracking-[-0.03em]">Human at the center</CardTitle>
              <CardDescription>
                The interface adapts to the identity methods your workspace
                actually enables.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-transparent shadow-none sm:col-span-2 lg:col-span-1">
            <CardHeader>
              <ArrowRight aria-hidden="true" className="size-5 text-primary" />
              <CardTitle className="mt-5 text-xl tracking-[-0.03em]">Ready for the next step</CardTitle>
              <CardDescription>
                Sign in, create an identity, or recover access without leaving
                the same deliberate surface.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="flex flex-col gap-6 border-t border-border/70 pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            Identity infrastructure for thoughtful teams.
          </p>
          <Link
            className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
            href="/auth/login"
          >
            Open sign in
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Link>
        </section>
      </main>
    </div>
  );
}
