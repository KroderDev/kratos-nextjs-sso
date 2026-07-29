import Link from "next/link";
import { getLoginFlow, type OryPageParams } from "@ory/nextjs/app";

import { AuthShell } from "@/components/layout/auth-shell";
import { AuthFlowPage } from "@/components/ory/auth-flow-page";
import { OrySetupState } from "@/components/ory/setup-state";
import { rewriteOryFlow } from "@/lib/ory/url";
import config, { isOryConfigured } from "@/ory.config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: OryPageParams) {
  if (!isOryConfigured) {
    return (
      <AuthShell
        description="Use the identity method configured for this workspace."
        eyebrow="Secure access"
        footer={
          <span>
            Need an identity?{" "}
            <Link className="font-medium text-primary hover:underline" href="/auth/registration">
              Create one
            </Link>
          </span>
        }
        title="Welcome back"
      >
        <OrySetupState />
      </AuthShell>
    );
  }

  let flow = null;
  try {
    flow = rewriteOryFlow(await getLoginFlow(config, searchParams)) || null;
  } catch {
    // flow stays null → FlowUnavailable renders
  }

  return (
    <AuthFlowPage
      description="Use the identity method configured for this workspace."
      eyebrow="Secure access"
      flow={flow}
      footer={
        <span>
          Need an identity?{" "}
          <Link className="font-medium text-primary hover:underline" href="/auth/registration">
            Create one
          </Link>
          <span className="mx-2 text-border">/</span>
          <Link className="font-medium text-primary hover:underline" href="/auth/recovery">
            Recover access
          </Link>
        </span>
      }
      kind="login"
      title="Welcome back"
    />
  );
}
