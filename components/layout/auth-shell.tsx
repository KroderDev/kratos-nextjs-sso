import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

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
          <div className="signal-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="signal-orbit pointer-events-none absolute -right-32 top-28 size-[31rem] rounded-full border border-background/10" />
          <div className="signal-orbit signal-orbit-delayed pointer-events-none absolute -right-12 top-48 size-[18rem] rounded-full border border-signal/25" />

          <div className="relative z-10">
            <Brand inverted />
          </div>

          <div className="relative z-10 max-w-sm">
            <Badge className="border-background/20 bg-background/10 text-background hover:bg-background/15">
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-signal" />
              identity infrastructure
            </Badge>
            <h2 className="mt-8 max-w-xs text-4xl font-semibold leading-[1.03] tracking-[-0.05em] xl:text-5xl">
              Access should feel like a quiet room.
            </h2>
            <p className="mt-6 max-w-xs text-sm leading-6 text-background/65">
              One considered entry point for the people, projects, and private
              work that matter to your team.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-3 border-t border-background/15 pt-5 text-xs text-background/55">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
                  protocol
                </p>
                <p className="mt-2">Ory browser flows</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
                  posture
                </p>
                <p className="mt-2">Server rendered</p>
              </div>
            </div>
          </div>

          <p className="relative z-10 font-mono text-[10px] uppercase tracking-[0.18em] text-background/35">
            private by design / 2026
          </p>
        </aside>

        <main className="flex min-h-screen flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-14 lg:py-12 xl:px-24">
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
            <Brand className="lg:hidden" />

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
                K / 01
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
