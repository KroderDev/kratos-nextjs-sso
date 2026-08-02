"use client";

import type { OryFlow, OryFlowKind } from "@/lib/ory/types";
import { getNodeAttributes, getString, isProviderNode } from "@/lib/ory/flow";
import Script from "next/script";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { FlowMessages } from "./flow-messages";
import { OryNode } from "./ory-node";
import { OryTriggerRuntime } from "./ory-trigger-runtime";
import { allowedOryOrigins, isSafeFlowAction } from "@/lib/ory/security";
import { appBaseUrl, oryCanonicalUrl, orySdkUrl } from "@/ory.config";
import { useTranslation } from "@/lib/i18n/client";

type FlowFormProps = {
  embedded?: boolean;
  flow: OryFlow;
  kind: OryFlowKind;
  separateProviders?: boolean;
};

/**
 * Renders an Ory authentication flow form with optional embedded styling.
 *
 * @param embedded - Whether to render the form without the surrounding card
 * @param flow - The Ory authentication flow to render
 * @param kind - The type of authentication flow
 * @returns The rendered form, or `null` when the flow action is unsafe
 */
export function FlowForm({ embedded = false, flow, kind, separateProviders = true }: FlowFormProps) {
  const { t } = useTranslation();
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
  const nodes = flow.ui.nodes.filter((node) => {
    if (kind !== "registration") return true;
    const name = getString(getNodeAttributes(node).name);
    return name !== "traits.avatar_url";
  });
  const providerNodes = separateProviders ? nodes.filter(isProviderNode) : [];
  const formNodes = separateProviders ? nodes.filter((node) => !isProviderNode(node)) : nodes;
  const compactProviders = providerNodes.length >= 3;
  const providerGridClass = compactProviders
    ? "grid-cols-3"
    : providerNodes.length === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1";

  const form = (
    <form action={flow.ui.action} className="flex flex-col gap-6" method={method}>
      <FlowMessages messages={flow.ui.messages} />
      <div className="flex flex-col gap-5">
        {formNodes.map((node, index) => (
          <OryNode key={`${node.type}-${index}`} kind={kind} node={node} />
        ))}
      </div>
      {providerNodes.length > 0 && formNodes.length > 0 ? (
        <div
          aria-label={t(compactProviders ? "ory.nodes.emailDividerCompact" : "ory.nodes.emailDivider")}
          className="flex items-center gap-3 py-1 text-xs font-medium text-muted-foreground"
          role="separator"
        >
          <Separator aria-hidden="true" className="flex-1" />
          <span className="shrink-0">
            {t(compactProviders ? "ory.nodes.emailDividerCompact" : "ory.nodes.emailDivider")}
          </span>
          <Separator aria-hidden="true" className="flex-1" />
        </div>
      ) : null}
      {providerNodes.length > 0 ? (
        <section aria-label={t("ory.nodes.socialLogin")} className={`grid gap-3 ${providerGridClass}`}>
          {providerNodes.map((node, index) => (
            <OryNode
              compactProvider={compactProviders}
              key={`${node.type}-${index}`}
              kind={kind}
              node={node}
            />
          ))}
        </section>
      ) : null}
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
