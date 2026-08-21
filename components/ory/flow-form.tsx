"use client";

import { useRef, useState, type FormEvent } from "react";

import type { OryFlow, OryFlowKind, RenderableOryFlow } from "@/lib/ory/types";
import {
  getLookupSecretAction,
  getLookupSecretEntries,
  getNodeAttributes,
  getString,
  hasPasswordLogin,
  isHiddenInputNode,
  isLookupSecretCodeNode,
  isProviderNode,
  isSocialOnlyLogin,
} from "@/lib/ory/flow";
import Script from "next/script";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";

import { FlowMessages } from "./flow-messages";
import { OryNode } from "./ory-node";
import { isAllowedOryTrigger, OryTriggerRuntime } from "./ory-trigger-runtime";
import { rememberSettingsAction } from "./settings-navigation";
import {
  getSettingsAreaDefinition,
  type SettingsArea,
  SETTINGS_SECTION_DEFINITIONS,
} from "./settings-sections";
import { allowedOryOrigins, isSafeFlowAction } from "@/lib/ory/security";
import { appBaseUrl, oryCanonicalUrl, orySdkUrl } from "@/ory.config";
import { useTranslation } from "@/lib/i18n/client";

type FlowFormProps = {
  embedded?: boolean;
  flow: RenderableOryFlow;
  flowState?: string | null;
  kind: OryFlowKind;
  separateProviders?: boolean;
  settingsArea?: SettingsArea;
};

type SettingsRenderableSection = {
  area: SettingsArea;
  description: string;
  group: string;
  label: string;
  nodes: OryFlow["ui"]["nodes"];
};

const KNOWN_SETTINGS_GROUPS = new Set<string>(
  SETTINGS_SECTION_DEFINITIONS.map((section) => section.group),
);
const OTHER_SETTINGS_SECTION = {
  description: "dashboard.settings.cards.other.description",
  group: "other",
  label: "dashboard.settings.cards.other.title",
} as const;

/**
 * Renders Ory flow nodes as `OryNode` components.
 *
 * @param nodes - The flow nodes to render
 * @param kind - The type of Ory flow
 * @param keyPrefix - Prefix used to generate stable component keys
 * @param lookupSecretPending - Whether lookup-secret confirmation is pending
 * @param formId - Optional identifier of the containing form
 * @param lookupSecretConfirmationNode - Optional lookup-secret confirmation node
 * @param onActionStart - Optional callback invoked when an action begins
 * @param onTriggerStart - Optional callback invoked before an allowlisted trigger starts
 * @param formPending - Whether the containing form has started submitting
 * @param formSubmitter - Optional identifier of the control that submitted the form
 * @returns The rendered Ory node components
 */
function renderNodes(
  nodes: OryFlow["ui"]["nodes"],
  kind: OryFlowKind,
  keyPrefix: string,
  lookupSecretPending = false,
  formId?: string,
  lookupSecretConfirmationNode?: OryFlow["ui"]["nodes"][number],
  onActionStart?: () => void,
  onTriggerStart?: (submitter: string) => boolean,
  formPending = false,
  formSubmitter?: string,
) {
  return nodes.map((node, index) => (
    <OryNode
      formId={formId}
      formPending={formPending}
      formSubmitter={formSubmitter}
      key={`${keyPrefix}-${node.type}-${index}`}
      kind={kind}
      lookupSecretConfirmationNode={lookupSecretConfirmationNode}
      lookupSecretPending={lookupSecretPending}
      node={node}
      onActionStart={onActionStart}
      onTriggerStart={onTriggerStart}
    />
  ));
}

/**
 * Tracks form submission state and identifies the control that initiated the submission.
 *
 * @param onSubmit - Optional callback invoked when the first submission begins.
 * @returns Submission handlers, pending state, and submitting control identifier.
 */
function useFlowSubmissionState(onSubmit?: () => void) {
  const [pending, setPending] = useState(false);
  const [submitter, setSubmitter] = useState<string | undefined>();
  const pendingRef = useRef(false);
  const triggerCompletionRef = useRef(false);

  function handleTriggerStart(actionSubmitter: string) {
    if (pendingRef.current) {
      return false;
    }

    setSubmitter(actionSubmitter);
    triggerCompletionRef.current = true;
    pendingRef.current = true;
    setPending(true);
    return true;
  }

  function handleSubmitCapture(event: FormEvent<HTMLFormElement>) {
    if (pendingRef.current) {
      if (triggerCompletionRef.current) {
        triggerCompletionRef.current = false;
        return;
      }

      event.preventDefault();
      return;
    }

    const nativeSubmitter = (event.nativeEvent as SubmitEvent).submitter;
    if (
      nativeSubmitter instanceof HTMLButtonElement ||
      nativeSubmitter instanceof HTMLInputElement
    ) {
      setSubmitter(`${nativeSubmitter.name}\u0000${nativeSubmitter.value}`);
    }
    pendingRef.current = true;
    setPending(true);
    onSubmit?.();
  }

  return { handleSubmitCapture, handleTriggerStart, pending, submitter };
}

/**
 * Renders a settings section as a form within a card, including its fields, shared inputs, and actions.
 *
 * @param action - The form submission URL
 * @param kind - The type of Ory flow being rendered
 * @param section - The settings section and its nodes
 * @param settingsArea - The settings area containing the section
 * @param sharedNodes - Hidden or shared nodes rendered in the section
 * @returns The rendered settings section form
 */
function SettingsSectionCard({
  action,
  kind,
  lookupSecretPending,
  method,
  section,
  settingsArea,
  sharedNodes,
  t,
}: {
  action: string;
  kind: OryFlowKind;
  lookupSecretPending: boolean;
  method: "get" | "post";
  section: SettingsRenderableSection;
  settingsArea: SettingsArea;
  sharedNodes: OryFlow["ui"]["nodes"];
  t: (key: string) => string;
}) {
  const formId = `settings-${section.group}-form`;
  const lookupSecretCodeNode = section.nodes.find(isLookupSecretCodeNode);
  const hasRenderableRecoveryCodes = lookupSecretCodeNode
    ? getLookupSecretEntries(lookupSecretCodeNode)!.length > 0
    : false;
  const lookupSecretConfirmationNode = hasRenderableRecoveryCodes && lookupSecretCodeNode
    ? section.nodes.find((node) => getLookupSecretAction(node) === "lookup_secret_confirm")
    : undefined;
  const actionNodes = section.nodes.filter(
    (node) => isActionNode(node) && node !== lookupSecretConfirmationNode,
  );
  const contentNodes = section.nodes.filter(
    (node) => !isActionNode(node) && !isHiddenInputNode(node),
  );
  const showCardHeader = settingsArea !== "connections";
  const renderActionsInBody = settingsArea === "connections" || section.group === "lookup_secret";
  const handleActionStart = () => rememberSettingsAction(settingsArea);
  const { handleSubmitCapture, handleTriggerStart, pending, submitter } =
    useFlowSubmissionState(handleActionStart);
  const hiddenNodes = [
    ...sharedNodes,
    ...section.nodes.filter(isHiddenInputNode),
  ];

  return (
    <form
      aria-busy={pending || undefined}
      action={action}
      className="min-w-0"
      data-settings-area={settingsArea}
      data-settings-form={section.group}
      data-submitting={pending || undefined}
      id={formId}
      method={method}
      onSubmitCapture={handleSubmitCapture}
    >
      <Card
        aria-label={!showCardHeader ? t(section.label) : undefined}
        aria-labelledby={showCardHeader ? `${formId}-title` : undefined}
        data-settings-card={section.group}
        role="group"
      >
        {showCardHeader ? (
          <CardHeader className="border-b border-border/70">
            <CardTitle id={`${formId}-title`}>{t(section.label)}</CardTitle>
            <CardDescription>{t(section.description)}</CardDescription>
          </CardHeader>
        ) : null}
        <CardContent className="flex flex-col gap-5">
          {renderNodes(
            hiddenNodes,
            kind,
            `settings-${section.group}-shared`,
            lookupSecretPending,
            formId,
            lookupSecretConfirmationNode,
            undefined,
            handleTriggerStart,
            pending,
            submitter,
          )}
          {contentNodes.length > 0 ? (
            <FieldGroup>
              {renderNodes(
                contentNodes,
                kind,
                `settings-${section.group}`,
                lookupSecretPending,
                formId,
                lookupSecretConfirmationNode,
                handleActionStart,
                handleTriggerStart,
                pending,
                submitter,
              )}
            </FieldGroup>
          ) : null}
          {renderActionsInBody && actionNodes.length > 0 ? (
            <div
              className={`flex flex-col items-stretch gap-3 sm:flex-row ${
                settingsArea === "connections" ? "sm:justify-start" : "sm:justify-end"
              }`}
            >
              {renderNodes(
                actionNodes,
                kind,
                `settings-${section.group}-actions`,
                lookupSecretPending,
                formId,
                lookupSecretConfirmationNode,
                handleActionStart,
                handleTriggerStart,
                pending,
                submitter,
              )}
            </div>
          ) : null}
        </CardContent>
        {!renderActionsInBody && actionNodes.length > 0 ? (
          <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
            {renderNodes(
              actionNodes,
              kind,
              `settings-${section.group}-actions`,
              lookupSecretPending,
              formId,
              lookupSecretConfirmationNode,
              handleActionStart,
              handleTriggerStart,
              pending,
              submitter,
            )}
          </CardFooter>
        ) : null}
      </Card>
    </form>
  );
}

/**
 * Renders the settings-flow nodes grouped into configured sections for the selected settings area.
 *
 * @param action - Form action URL used by each settings section
 * @param kind - Ory flow kind
 * @param method - Form submission method
 * @param nodes - Nodes to group and render
 * @param settingsArea - Settings area whose sections should be displayed
 * @param t - Translation function for section labels and messages
 */
function SettingsNodeSections({
  action,
  kind,
  method,
  nodes,
  settingsArea,
  t,
}: {
  action: string;
  kind: OryFlowKind;
  method: "get" | "post";
  nodes: OryFlow["ui"]["nodes"];
  settingsArea: SettingsArea;
  t: (key: string) => string;
}) {
  const groupedNodes = SETTINGS_SECTION_DEFINITIONS.filter(
    (section) => section.area === settingsArea,
  ).map((section) => ({
    ...section,
    nodes: nodes.filter((node) => node.group === section.group),
  }));
  const sharedNodes = nodes.filter(
    (node) => isHiddenInputNode(node) && node.group === "default",
  );
  const ungroupedNodes = nodes.filter(
    (node) =>
      !KNOWN_SETTINGS_GROUPS.has(node.group) &&
      (!isHiddenInputNode(node) || node.group !== "default"),
  );
  const lookupSecretPending = nodes.some(
    (node) => getLookupSecretAction(node) === "lookup_secret_confirm",
  );
  const visibleSections: SettingsRenderableSection[] = groupedNodes.filter(
    (section) => section.nodes.length > 0,
  );
  const areaDefinition = getSettingsAreaDefinition(settingsArea);

  if (ungroupedNodes.length > 0) {
    visibleSections.push({ ...OTHER_SETTINGS_SECTION, area: settingsArea, nodes: ungroupedNodes });
  }

  return (
    <div className="flex flex-col gap-5" data-settings-area-content={settingsArea}>
      {visibleSections.length > 0
        ? visibleSections.map((section) => (
            <SettingsSectionCard
              action={action}
              kind={kind}
              key={section.group}
              lookupSecretPending={lookupSecretPending}
              method={method}
              section={section}
              settingsArea={settingsArea}
              sharedNodes={sharedNodes}
              t={t}
            />
          ))
        : null}
      {visibleSections.length === 0 ? (
        <Card data-settings-empty={settingsArea}>
          <CardHeader>
            <CardTitle>{t(areaDefinition.label)}</CardTitle>
            <CardDescription>{t(areaDefinition.description)}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("dashboard.settings.noSettings")}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

/**
 * Determines whether an Ory flow node represents an action control.
 *
 * @param node - The flow node to inspect
 * @returns `true` if the node is a submit or button input, `false` otherwise.
 */
function isActionNode(node: OryFlow["ui"]["nodes"][number]) {
  if (node.type !== "input") {
    return false;
  }

  const inputType = getString(getNodeAttributes(node).type);
  return inputType === "submit" || inputType === "button";
}

/**
 * Renders an Ory authentication or settings flow form with optional embedded styling.
 *
 * @param embedded - Whether to render the form without a surrounding card
 * @param flow - The Ory flow to render
 * @param flowState - Optional state associated with the flow
 * @param kind - The type of flow being rendered
 * @param separateProviders - Whether to render provider nodes separately from other form nodes
 * @param settingsArea - The settings area whose sections should be rendered
 * @returns The rendered form, or `null` when the flow action is unsafe
 */
export function FlowForm({
  embedded = false,
  flow,
  flowState,
  kind,
  separateProviders = true,
  settingsArea = "profile",
}: FlowFormProps) {
  const { t } = useTranslation();
  const { handleSubmitCapture, handleTriggerStart, pending, submitter } = useFlowSubmissionState();
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

    return triggers.some((trigger) => isAllowedOryTrigger(trigger));
  });
  const onloadTriggers = flow.ui.nodes
    .map((node) => getString(getNodeAttributes(node).onloadTrigger))
    .filter((trigger): trigger is string => isAllowedOryTrigger(trigger));
  const nodes = flow.ui.nodes;
  const providerNodes = separateProviders ? nodes.filter(isProviderNode) : [];
  const formNodes = separateProviders ? nodes.filter((node) => !isProviderNode(node)) : nodes;
  const visibleFormNodes = formNodes.filter((node) => !isHiddenInputNode(node));
  const compactProviders = providerNodes.length >= 3;
  const providerGridClass = compactProviders
    ? "grid-cols-3"
    : providerNodes.length === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1";
  const socialOnly = separateProviders && isSocialOnlyLogin(nodes, providerNodes);

  const form =
    kind === "settings" ? (
      <>
        <FlowMessages flowState={flowState} messages={flow.ui.messages} mode="toast" />
        <SettingsNodeSections
          action={flow.ui.action}
          kind={kind}
          method={method}
          nodes={formNodes}
          settingsArea={settingsArea}
          t={t}
        />
      </>
    ) : (
      <form
        action={flow.ui.action}
        aria-busy={pending || undefined}
        className="flex flex-col gap-6"
        data-submitting={pending || undefined}
        method={method}
        onSubmitCapture={handleSubmitCapture}
      >
        <FlowMessages messages={flow.ui.messages} />
        {renderNodes(
          formNodes.filter((node) => isHiddenInputNode(node)),
          kind,
          "form-hidden",
          false,
          undefined,
          undefined,
          undefined,
          handleTriggerStart,
          pending,
          submitter,
        )}
        {visibleFormNodes.length > 0 ? (
          <div className="flex flex-col gap-5">
            {renderNodes(
              visibleFormNodes,
              kind,
              "form",
              false,
              undefined,
              undefined,
              undefined,
              handleTriggerStart,
              pending,
              submitter,
            )}
          </div>
        ) : null}
        {!socialOnly && providerNodes.length > 0 && hasPasswordLogin(nodes) ? (
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
          <section
            aria-label={t("ory.nodes.socialLogin")}
            className={socialOnly ? "flex flex-col items-center gap-3 pt-1" : `grid gap-3 ${providerGridClass}`}
          >
            {providerNodes.map((node, index) => (
              <OryNode
                compactProvider={compactProviders}
                key={`${node.type}-${index}`}
                kind={kind}
                node={node}
                formPending={pending}
                formSubmitter={submitter}
                onTriggerStart={handleTriggerStart}
              />
            ))}
          </section>
        ) : null}
      </form>
    );

  if (embedded) {
    return (
      <div className={kind === "settings" ? undefined : "border-t border-border/70 pt-8"}>
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
