import { getLogoutFlow, getServerSession } from "@ory/nextjs/app";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  Clock3,
  Fingerprint,
  ShieldCheck,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OrySetupState } from "@/components/ory/setup-state";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getIdentityEmail,
  getIdentityInitials,
  getIdentityName,
} from "@/lib/ory/identity";
import { appBaseUrl, isOryConfigured } from "@/ory.config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Overview" };

function formatDate(value: Date | undefined) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function DashboardPage() {
  if (!isOryConfigured) {
    return (
      <DashboardShell activeNav="overview">
        <div className="min-h-[calc(100vh-12rem)] max-w-xl py-16">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Protected workspace
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
              Your control room is waiting.
            </h1>
            <p className="mt-5 text-muted-foreground">
              The authentication service is not ready to accept sessions yet.
            </p>
            <div className="mt-8 max-w-lg">
              <OrySetupState />
            </div>
        </div>
      </DashboardShell>
    );
  }

  const session = await getServerSession();

  if (!session?.identity) {
    redirect("/auth/login?return_to=/dashboard");
  }

  const identity = session.identity;
  const name = getIdentityName(identity);
  const email = getIdentityEmail(identity);
  const logoutFlow = await getLogoutFlow(
    appBaseUrl ? { returnTo: appBaseUrl } : undefined,
  );

  return (
    <DashboardShell
      activeNav="overview"
      account={{
        email,
        initials: getIdentityInitials(identity),
        label: name,
        logoutUrl: logoutFlow.logout_url,
      }}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  Control room / overview
                </p>
                <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-6xl">
                  Good to see you, {name.split(" ")[0]}.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                  Your identity is active and your private workspace is ready
                  for the next considered move.
                </p>
              </div>
              <Badge className="gap-2 border-primary/20 bg-primary/5 text-primary" variant="outline">
                <span className="size-1.5 rounded-full bg-primary" />
                Session active
              </Badge>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <Card className="bg-primary text-primary-foreground shadow-lg shadow-primary/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Fingerprint aria-hidden="true" className="size-5" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary-foreground/55">
                      identity
                    </span>
                  </div>
                  <CardTitle className="mt-7 text-2xl tracking-[-0.04em]">
                    Verified presence
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/65">
                    Your current session is recognized by the identity service.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                    <Check aria-hidden="true" data-icon="inline-start" />
                    Browser session established
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      posture
                    </span>
                  </div>
                  <CardTitle className="mt-7 text-2xl tracking-[-0.04em]">
                    Quietly protected
                  </CardTitle>
                  <CardDescription>
                    Session cookies and flow state stay on the server boundary.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ButtonLink href="/dashboard/settings" size="sm" variant="link">
                    Review account settings
                    <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
                  </ButtonLink>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-5">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl tracking-[-0.03em]">Session details</CardTitle>
                    <CardDescription className="mt-1">
                      The current browser session, without exposing credentials.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">server checked</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      identity email
                    </p>
                    <p className="mt-2 truncate text-sm font-medium">{email}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      session issued
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-medium">
                      <Clock3 aria-hidden="true" data-icon="inline-start" />
                      {formatDate(session.issued_at)}
                    </p>
                  </div>
                </div>
                <Separator className="my-6" />
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">session/{session.id.slice(0, 8)}</span>
                  <span>Expires {formatDate(session.expires_at)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="lg:pt-20">
            <div className="border-l border-border pl-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                Next move
              </p>
              <p className="mt-4 text-lg font-medium leading-6 tracking-[-0.02em]">
                Keep your identity details useful.
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Add a verified address or update your credentials whenever the
                shape of your work changes.
              </p>
              <ButtonLink className="mt-6" href="/dashboard/settings" size="sm" variant="link">
                Open settings
                <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
              </ButtonLink>
            </div>
          </aside>
      </div>
    </DashboardShell>
  );
}
