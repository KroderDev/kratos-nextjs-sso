import Link from "next/link";
import { getServerSession, getSettingsFlow, type OryPageParams } from "@ory/nextjs/app";
import { redirect } from "next/navigation";

import { AuthContent } from "@/components/layout/auth-shell";
import { AuthFlowPage } from "@/components/ory/auth-flow-page";
import { OrySetupState } from "@/components/ory/setup-state";
import { rewriteOryFlow } from "@/lib/ory/url";
import config, { isOryConfigured } from "@/ory.config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account settings" };

export default async function SettingsPage({ searchParams }: OryPageParams) {
  if (!isOryConfigured) {
    return (
        <AuthContent
        description="Update the identity attributes and credentials you control."
        eyebrow="Account settings"
        footer={
          <Link className="font-medium text-primary hover:underline" href="/">
            Return home
          </Link>
        }
        title="Keep your identity current"
      >
        <OrySetupState />
        </AuthContent>
    );
  }

  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login?return_to=/auth/settings");
  }

  let flow = null;
  try {
    flow = rewriteOryFlow(await getSettingsFlow(config, searchParams)) || null;
  } catch (e) {
    if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    // flow stays null → FlowUnavailable renders
  }

  return (
    <AuthFlowPage
      description="Update the identity attributes and credentials you control."
      eyebrow="Account settings"
      flow={flow}
      footer={
        <Link className="font-medium text-primary hover:underline" href="/dashboard">
          Return to dashboard
        </Link>
      }
      kind="settings"
      title="Keep your identity current"
    />
  );
}
