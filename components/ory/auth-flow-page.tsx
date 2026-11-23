import type { ReactNode } from "react";
import { CircleCheck } from "lucide-react";

import { toRenderableOryFlow, type OryFlow, type OryFlowKind } from "@/lib/ory/types";

import { AuthContent } from "@/components/layout/auth-shell";

import { FlowForm } from "./flow-form";
import { FlowMessages } from "./flow-messages";
import { FlowUnavailable } from "./flow-unavailable";

type AuthFlowPageProps = {
  flow: OryFlow | null | undefined;
  kind: OryFlowKind;
  title: string;
  description: string;
  emailSentTitle?: string;
  footer?: ReactNode;
  statusAction?: ReactNode;
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
 * @param title - The page title.
 * @param description - The page description.
 * @param footer - Optional content displayed below the page.
 * @returns The rendered authentication flow page.
 */
export function AuthFlowPage({
  flow,
  kind,
  title,
  description,
  emailSentTitle,
  footer,
  statusAction,
}: AuthFlowPageProps) {
  const flowState =
    hasRenderableFlowUi(flow) && typeof flow.state === "string" ? flow.state : undefined;
  const isEmailSentState =
    (kind === "recovery" || kind === "verification") && flowState === "sent_email";

  return (
    <AuthContent
      description={isEmailSentState ? undefined : description}
      footer={isEmailSentState ? undefined : footer}
      statusIcon={
        isEmailSentState ? (
          <span
            className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
            data-flow-status-icon
          >
            <CircleCheck aria-hidden="true" className="size-6" />
          </span>
        ) : undefined
      }
      title={isEmailSentState ? emailSentTitle ?? title : title}
    >
      {hasRenderableFlowUi(flow) ? (
        isEmailSentState ? (
          <div className="flex flex-col items-center gap-5">
            <FlowMessages
              flowState={flowState}
              messages={flow.ui.messages}
              mode="status"
            />
            <FlowForm
              embedded
              flow={toRenderableOryFlow(flow)}
              flowState={flowState}
              kind={kind}
              showFlowMessages={false}
            />
            {statusAction ? <div className="w-full">{statusAction}</div> : null}
          </div>
        ) : (
          <FlowForm
            embedded
            flow={toRenderableOryFlow(flow)}
            flowState={flowState}
            kind={kind}
            showFlowMessages
          />
        )
      ) : (
        <FlowUnavailable />
      )}
    </AuthContent>
  );
}
