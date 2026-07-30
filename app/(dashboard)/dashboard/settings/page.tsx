import Link from "next/link";
import { getLogoutFlow, getServerSession, getSettingsFlow, type OryPageParams } from "@ory/nextjs/app";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FlowForm } from "@/components/ory/flow-form";
import { FlowUnavailable } from "@/components/ory/flow-unavailable";
import { OrySetupState } from "@/components/ory/setup-state";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowUpRight } from "lucide-react";
import {
  getIdentityEmail,
  getIdentityInitials,
  getIdentityName,
} from "@/lib/ory/identity";
import { rewriteOryFlow } from "@/lib/ory/url";
import config, { appBaseUrl, isOryConfigured } from "@/ory.config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account settings" };

function SettingsIntro() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Control room / settings
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-6xl">
          Keep your identity current.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
          Update the identity attributes and credentials you control.
        </p>
      </div>
      <Badge className="gap-2 border-primary/20 bg-primary/5 text-primary" variant="outline">
        <span className="size-1.5 rounded-full bg-primary" />
        Account controls
      </Badge>
    </div>
  );
}

function SettingsAside() {
  return (
    <aside className="lg:pt-20">
      <div className="border-l border-border pl-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          Next move
        </p>
        <p className="mt-4 text-lg font-medium leading-6 tracking-[-0.02em]">
          Keep your access useful.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Review your identity details and credentials whenever the shape of your
          work changes.
        </p>
        <ButtonLink className="mt-6" href="/dashboard" size="sm" variant="link">
          Return to overview
          <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
        </ButtonLink>
      </div>
    </aside>
  );
}

export default async function SettingsPage({ searchParams }: OryPageParams) {
  if (!isOryConfigured) {
    return (
      <DashboardShell activeNav="settings">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
          <div>
            <SettingsIntro />
            <div className="mt-12 max-w-3xl">
              <OrySetupState />
            </div>
          </div>
          <SettingsAside />
        </div>
      </DashboardShell>
    );
  }

  const session = await getServerSession();

  if (!session?.identity) {
    redirect("/auth/login?return_to=/dashboard/settings");
  }

  const identity = session.identity;
  const name = getIdentityName(identity);
  const logoutFlow = await getLogoutFlow(
    appBaseUrl ? { returnTo: appBaseUrl } : undefined,
  );
  let flow = null;

  try {
    flow = rewriteOryFlow(await getSettingsFlow(config, searchParams)) || null;
  } catch (e) {
    if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    // flow stays null -> FlowUnavailable renders
  }

  return (
    <DashboardShell
      activeNav="settings"
      account={{
        email: getIdentityEmail(identity),
        initials: getIdentityInitials(identity),
        label: name,
        logoutUrl: logoutFlow.logout_url,
      }}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
        <div>
          <SettingsIntro />
          <div className="mt-12 max-w-3xl">
            {flow ? <FlowForm embedded flow={flow} kind="settings" /> : <FlowUnavailable />}
            <div className="mt-7 text-center text-sm text-muted-foreground">
              <Link className="font-medium text-primary hover:underline" href="/dashboard">
                Return to overview
              </Link>
            </div>
          </div>
        </div>
        <SettingsAside />
      </div>
    </DashboardShell>
  );
}
