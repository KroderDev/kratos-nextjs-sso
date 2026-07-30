import type { ReactNode } from "react";

import type { OryFlow, OryFlowKind } from "@/lib/ory/types";

import { AuthContent } from "@/components/layout/auth-shell";

import { FlowForm } from "./flow-form";
import { FlowUnavailable } from "./flow-unavailable";

type AuthFlowPageProps = {
  flow: OryFlow | null | undefined;
  kind: OryFlowKind;
  eyebrow: string;
  title: string;
  description: string;
  footer?: ReactNode;
};

export function AuthFlowPage({
  flow,
  kind,
  eyebrow,
  title,
  description,
  footer,
}: AuthFlowPageProps) {
  return (
    <AuthContent
      description={description}
      eyebrow={eyebrow}
      footer={footer}
      title={title}
    >
      {flow ? <FlowForm flow={flow} kind={kind} /> : <FlowUnavailable />}
    </AuthContent>
  );
}
