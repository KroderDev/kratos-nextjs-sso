"use client";

import type { OryFlow, OryFlowKind } from "@/lib/ory/types";
import { getNodeAttributes, getString } from "@/lib/ory/flow";
import Script from "next/script";

import { Card, CardContent } from "@/components/ui/card";

import { FlowMessages } from "./flow-messages";
import { OryNode } from "./ory-node";
import { OryTriggerRuntime } from "./ory-trigger-runtime";
import { allowedOryOrigins, isSafeFlowAction } from "@/lib/ory/security";
import { appBaseUrl, oryCanonicalUrl, orySdkUrl } from "@/ory.config";

type FlowFormProps = {
  embedded?: boolean;
  flow: OryFlow;
  kind: OryFlowKind;
};

export function FlowForm({ embedded = false, flow, kind }: FlowFormProps) {
  const method = flow.ui.method.toLowerCase() === "get" ? "get" : "post";
  const origins = allowedOryOrigins([appBaseUrl ?? "", orySdkUrl, oryCanonicalUrl]);

  if (!isSafeFlowAction(flow.ui.action, origins)) {
    return null;
  }
  const needsWebAuthnScript = flow.ui.nodes.some((node) => {
    const attributes = getNodeAttributes(node);
    const triggers = [
      getString(attributes.onclickTrigger),
      getString(attributes.onloadTrigger),
    ];

    return triggers.some((trigger) => trigger?.startsWith("ory"));
  });
  const onloadTriggers = flow.ui.nodes
    .map((node) => getString(getNodeAttributes(node).onloadTrigger))
    .filter((trigger): trigger is string => Boolean(trigger));

  const form = (
    <form action={flow.ui.action} className="flex flex-col gap-6" method={method}>
      <FlowMessages messages={flow.ui.messages} />
      <div className="flex flex-col gap-5">
        {flow.ui.nodes
          .filter((node) => {
            if (kind !== "registration") return true;
            const name = getString(getNodeAttributes(node).name);
            return name !== "traits.avatar_url";
          })
          .map((node, index) => (
            <OryNode key={`${node.type}-${index}`} node={node} />
          ))}
      </div>
    </form>
  );

  if (embedded) {
    return (
      <div className="border-t border-border/70 pt-8">
        {needsWebAuthnScript ? (
          <Script
            id={`ory-webauthn-${flow.id}`}
            src="/.well-known/ory/webauthn.js"
            strategy="afterInteractive"
          />
        ) : null}
        <OryTriggerRuntime triggers={onloadTriggers} />
        {form}
      </div>
    );
  }

  return (
    <Card className="border-border/70 bg-card/85 shadow-xl shadow-foreground/5 backdrop-blur-sm">
      <CardContent className="px-6 py-4 sm:px-8 sm:py-5">
        {needsWebAuthnScript ? (
          <Script
            id={`ory-webauthn-${flow.id}`}
            src="/.well-known/ory/webauthn.js"
            strategy="afterInteractive"
          />
        ) : null}
        <OryTriggerRuntime triggers={onloadTriggers} />
        {form}
      </CardContent>
    </Card>
  );

}
