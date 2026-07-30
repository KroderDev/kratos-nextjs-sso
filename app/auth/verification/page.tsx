import Link from "next/link";
import { getVerificationFlow, type OryPageParams } from "@ory/nextjs/app";

import { AuthContent } from "@/components/layout/auth-shell";
import { AuthFlowPage } from "@/components/ory/auth-flow-page";
import { OrySetupState } from "@/components/ory/setup-state";
import { rewriteOryFlow } from "@/lib/ory/url";
import config, { isOryConfigured } from "@/ory.config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify your address" };

export default async function VerificationPage({
  searchParams,
}: OryPageParams) {
  if (!isOryConfigured) {
    return (
        <AuthContent
        description="Confirm the address connected to your identity."
        eyebrow="Verify your address"
        footer={
          <span>
            Need to start over?{" "}
            <Link className="font-medium text-primary hover:underline" href="/auth/login">
              Return to sign in
            </Link>
          </span>
        }
        title="One last clear signal"
      >
        <OrySetupState />
        </AuthContent>
    );
  }

  let flow = null;
  try {
    flow =
      rewriteOryFlow(await getVerificationFlow(config, searchParams)) || null;
  } catch (e) {
    if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    // flow stays null → FlowUnavailable renders
  }

  return (
    <AuthFlowPage
      description="Confirm the address connected to your identity."
      eyebrow="Verify your address"
      flow={flow}
      footer={
        <span>
          Need to start over?{" "}
          <Link className="font-medium text-primary hover:underline" href="/auth/login">
            Return to sign in
          </Link>
        </span>
      }
      kind="verification"
      title="One last clear signal"
    />
  );
}
