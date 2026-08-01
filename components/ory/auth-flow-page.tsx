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

function hasRenderableFlowUi(flow: OryFlow | null | undefined): flow is OryFlow {
  if (!flow || typeof flow !== "object") {
    return false;
  }

  const ui = (flow as unknown as Record<string, unknown>).ui;
  if (!ui || typeof ui !== "object") {
    return false;
  }

  const uiRecord = ui as Record<string, unknown>;
  return (
    typeof uiRecord.action === "string" &&
    typeof uiRecord.method === "string" &&
    Array.isArray(uiRecord.nodes)
  );
}

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
      {hasRenderableFlowUi(flow) ? <FlowForm flow={flow} kind={kind} /> : <FlowUnavailable />}
    </AuthContent>
  );
}
