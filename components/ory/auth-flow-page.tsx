import type { ReactNode } from "react";

import { toRenderableOryFlow, type OryFlow, type OryFlowKind } from "@/lib/ory/types";

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

/**
 * Renders an authentication flow page with its metadata and form content.
 *
 * @param flow - The authentication flow to render.
 * @param kind - The kind of authentication flow.
 * @param eyebrow - The text displayed above the page title.
 * @param title - The page title.
 * @param description - The page description.
 * @param footer - Optional content displayed below the page.
 * @returns The rendered authentication flow page.
 */
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
      {hasRenderableFlowUi(flow) ? (
        <FlowForm flow={toRenderableOryFlow(flow)} kind={kind} />
      ) : (
        <FlowUnavailable />
      )}
    </AuthContent>
  );
}
