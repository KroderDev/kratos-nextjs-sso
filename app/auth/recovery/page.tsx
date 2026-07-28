import Link from "next/link";
import { getRecoveryFlow, type OryPageParams } from "@ory/nextjs/app";

import { AuthShell } from "@/components/layout/auth-shell";
import { AuthFlowPage } from "@/components/ory/auth-flow-page";
import { OrySetupState } from "@/components/ory/setup-state";
import { rewriteOryFlow } from "@/lib/ory/url";
import config, { isOryConfigured } from "@/ory.config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recover access" };

export default async function RecoveryPage({ searchParams }: OryPageParams) {
  if (!isOryConfigured) {
    return (
      <AuthShell
        description="We will send the next step to a verified address on your account."
        eyebrow="Account recovery"
        footer={
          <span>
            Remembered your details?{" "}
            <Link className="font-medium text-primary hover:underline" href="/auth/login">
              Return to sign in
            </Link>
          </span>
        }
        title="Let's get you back in"
      >
        <OrySetupState />
      </AuthShell>
    );
  }

  const flow = rewriteOryFlow(await getRecoveryFlow(config, searchParams)) || null;

  return (
    <AuthFlowPage
      description="We will send the next step to a verified address on your account."
      eyebrow="Account recovery"
      flow={flow}
      footer={
        <span>
          Remembered your details?{" "}
          <Link className="font-medium text-primary hover:underline" href="/auth/login">
            Return to sign in
          </Link>
        </span>
      }
      kind="recovery"
      title="Let's get you back in"
    />
  );
}
