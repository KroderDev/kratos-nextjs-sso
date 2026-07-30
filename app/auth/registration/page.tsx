import Link from "next/link";
import { getRegistrationFlow, type OryPageParams } from "@ory/nextjs/app";

import { AuthContent } from "@/components/layout/auth-shell";
import { AuthFlowPage } from "@/components/ory/auth-flow-page";
import { OrySetupState } from "@/components/ory/setup-state";
import { rewriteOryFlow } from "@/lib/ory/url";
import config, { isOryConfigured } from "@/ory.config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create an identity" };

export default async function RegistrationPage({
  searchParams,
}: OryPageParams) {
  if (!isOryConfigured) {
    return (
        <AuthContent
        description="Create a workspace identity with the fields your team requires."
        eyebrow="New identity"
        footer={
          <span>
            Already have access?{" "}
            <Link className="font-medium text-primary hover:underline" href="/auth/login">
              Sign in
            </Link>
          </span>
        }
        title="Make room for what is next"
      >
        <OrySetupState />
        </AuthContent>
    );
  }

  let flow = null;
  try {
    flow =
      rewriteOryFlow(await getRegistrationFlow(config, searchParams)) || null;
  } catch (e) {
    if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    // flow stays null → FlowUnavailable renders
  }

  return (
    <AuthFlowPage
      description="Create a workspace identity with the fields your team requires."
      eyebrow="New identity"
      flow={flow}
      footer={
        <span>
          Already have access?{" "}
          <Link className="font-medium text-primary hover:underline" href="/auth/login">
            Sign in
          </Link>
        </span>
      }
      kind="registration"
      title="Make room for what is next"
    />
  );
}
