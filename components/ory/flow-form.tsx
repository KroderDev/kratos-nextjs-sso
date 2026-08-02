"use client";

import type { OryFlow, OryFlowKind } from "@/lib/ory/types";
import { getNodeAttributes, getString, isProviderNode } from "@/lib/ory/flow";
import Script from "next/script";

import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
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

const SETTINGS_SECTION_DEFINITIONS = [
  { group: "profile", label: "dashboard.settings.sections.profile" },
  { group: "password", label: "dashboard.settings.sections.password" },
  { group: "totp", label: "dashboard.settings.sections.totp" },
  { group: "lookup_secret", label: "dashboard.settings.sections.lookupSecret" },
  { group: "oidc", label: "dashboard.settings.sections.oidc" },
] as const;

function renderNodes(nodes: OryFlow["ui"]["nodes"], kind: OryFlowKind, keyPrefix: string) {
  return nodes.map((node, index) => (
    <OryNode key={`${keyPrefix}-${node.type}-${index}`} kind={kind} node={node} />
  ));
}

function SettingsNodeSections({
  action,
  kind,
  method,
  nodes,
  t,
}: {
  action: string;
  kind: OryFlowKind;
  method: "get" | "post";
  nodes: OryFlow["ui"]["nodes"];
  t: (key: string) => string;
}) {
  const groupedNodes = SETTINGS_SECTION_DEFINITIONS.map((section) => ({
    ...section,
    nodes: nodes.filter((node) => node.group === section.group),
  }));
  const ungroupedNodes = nodes.filter(
    (node) => !SETTINGS_SECTION_DEFINITIONS.some((section) => section.group === node.group),
  );

  return (
    <div className="flex flex-col gap-5">
      {groupedNodes.map((section) =>
        section.nodes.length > 0 ? (
          <FieldSet
            className="gap-5 rounded-none border-0 border-t border-border/70 px-0 py-6 first-of-type:border-t-0 first-of-type:pt-0"
            key={section.group}
          >
            <FieldLegend
              className="mb-2 flex w-full items-center gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-primary after:h-px after:flex-1 after:bg-border/70 after:content-['']"
              variant="label"
            >
              {t(section.label)}
            </FieldLegend>
            <form action={action} className="flex flex-col gap-5" method={method}>
              {renderNodes(ungroupedNodes, kind, `settings-${section.group}-ungrouped`)}
              <FieldGroup>{renderNodes(section.nodes, kind, `settings-${section.group}`)}</FieldGroup>
            </form>
          </FieldSet>
        ) : null,
      )}
      {groupedNodes.every((section) => section.nodes.length === 0) && ungroupedNodes.length > 0 ? (
        <form action={action} className="flex flex-col gap-5" method={method}>
          {renderNodes(ungroupedNodes, kind, "settings-ungrouped")}
        </form>
      ) : null}
    </div>
  );
}

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
    if (kind !== "registration" && kind !== "settings") return true;
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

  const form =
    kind === "settings" ? (
      <>
        <FlowMessages messages={flow.ui.messages} />
        <SettingsNodeSections
          action={flow.ui.action}
          kind={kind}
          method={method}
          nodes={formNodes}
          t={t}
        />
      </>
    ) : (
      <form action={flow.ui.action} className="flex flex-col gap-6" method={method}>
        <FlowMessages messages={flow.ui.messages} />
        <div className="flex flex-col gap-5">{renderNodes(formNodes, kind, "form")}</div>
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
