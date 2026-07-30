import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { brandMark } from "@/lib/branding";

import { Brand } from "./brand";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[minmax(22rem,0.78fr)_minmax(34rem,1fr)]">
        <aside className="relative hidden overflow-hidden bg-foreground px-10 py-10 text-background lg:flex lg:flex-col lg:justify-between xl:px-14">
          <div className="relative z-10">
            <Brand inverted />
          </div>

          <div className="relative z-10 max-w-md">
            <Badge className="border-background/20 bg-background/10 text-background hover:bg-background/15">
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-signal" />
              identity infrastructure
            </Badge>
            <h2 className="mt-8 max-w-sm text-4xl font-semibold leading-[1.03] tracking-[-0.05em] xl:text-5xl">
              Your workspace begins with a clear handoff.
            </h2>
            <p className="mt-6 max-w-xs text-sm leading-6 text-background/65">
              Sign in once, then get out of the way. Your identity stays close to
              the server while your work stays yours.
            </p>

            <div className="mt-10 grid max-w-md gap-3 border-t border-background/15 pt-5 text-xs text-background/60">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
                  session
                </span>
                <span>Protected browser flow</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
                  boundary
                </span>
                <span>Server rendered</span>
              </div>
            </div>
          </div>

          <p className="relative z-10 font-mono text-[10px] uppercase tracking-[0.18em] text-background/35">
            private by design / 2026
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

            <div className="my-auto py-12 sm:py-16">
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

            <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-5 text-[11px] text-muted-foreground">
              <span>Protected browser session</span>
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
