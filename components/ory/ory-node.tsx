"use client";

/* Ory may provide runtime-hosted images such as QR codes. */
/* eslint-disable @next/next/no-img-element */

import type { UiNode } from "@ory/client-fetch";
import { useState } from "react";
import Script from "next/script";
import { ArrowUpRight } from "lucide-react";

import type { OryFlowKind } from "@/lib/ory/types";

import { ButtonLink } from "@/components/ui/button-link";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import {
  getNodeAttributes,
  getErrorMessages,
  getLookupSecretAction,
  getLookupSecretEntries,
  getNodeLabel,
  getNodeMessages,
  getNodeText,
  getNumber,
  getProviderName,
  getString,
  getSafeText,
  isLookupSecretInput,
  isLookupSecretCodeNode,
  isProviderNode,
  isChecked,
  isCodeInput,
  isTotpCodeInput,
} from "@/lib/ory/flow";

import { OryTriggerButton } from "./ory-trigger-button";
import { ProviderIcon } from "./provider-icon";
import { RecoveryCodes } from "./recovery-codes";
import { allowedOryOrigins, isSafeProviderUrl } from "@/lib/ory/security";
import { appBaseUrl, oryCanonicalUrl, orySdkUrl } from "@/ory.config";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

const allowedOrigins = allowedOryOrigins([appBaseUrl ?? "", orySdkUrl, oryCanonicalUrl]);

const VALID_REFERRER_POLICIES = new Set([
  "no-referrer",
  "no-referrer-when-downgrade",
  "origin",
  "origin-when-cross-origin",
  "same-origin",
  "strict-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url",
]);

const SAFE_QR_DATA_URL = /^data:image\/(?:gif|jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

type OryNodeProps = {
  compactProvider?: boolean;
  formId?: string;
  formPending?: boolean;
  formSubmitter?: string;
  kind?: OryFlowKind;
  lookupSecretConfirmationNode?: UiNode;
  lookupSecretPending?: boolean;
  node: UiNode;
  onActionStart?: () => void;
  onTriggerStart?: (submitter: string) => boolean;
};

/**
 * Derives an identifier for an Ory UI node.
 *
 * @param node - The UI node whose identifier is derived
 * @returns The node's `id`, its `name`, or `"ory-node"` when neither is available
 */
function nodeId(node: UiNode) {
  const attributes = getNodeAttributes(node);
  return getString(attributes.id) ?? getString(attributes.name) ?? "ory-node";
}

/**
 * Renders an Ory UI node according to its type, flow, locale, and validation state.
 *
 * @param compactProvider - Whether provider actions should use a compact icon-only layout.
 * @param formId - Optional form identifier used to associate rendered actions with a form.
 * @param formPending - Whether the containing form has started submitting.
 * @param formSubmitter - Name/value key of the action that initiated submission.
 * @param kind - The flow kind used to determine flow-specific labels and behavior.
 * @param lookupSecretConfirmationNode - Optional node rendered as the lookup-secret confirmation action.
 * @param lookupSecretPending - Whether lookup-secret recovery codes are pending.
 * @param onActionStart - Callback invoked when an Ory action starts.
 * @param onTriggerStart - Callback invoked before an allowlisted Ory trigger starts.
 */
export function OryNode({
  compactProvider = false,
  formId,
  formPending = false,
  formSubmitter,
  kind,
  lookupSecretConfirmationNode,
  lookupSecretPending = false,
  node,
  onActionStart,
  onTriggerStart,
}: OryNodeProps) {
  const { t, locale } = useTranslation();
  const [otpValue, setOtpValue] = useState<string | undefined>();
  const attributes = getNodeAttributes(node);
  const rawId = nodeId(node);
  const id = formId ? `${formId}-${rawId}` : rawId;

  if (node.type === "input") {
    const inputType = getString(attributes.type) ?? "text";
    const name = getString(attributes.name) ?? id;
    const value = attributes.value;
    const stringValue = getString(value);
    const label = getNodeLabel(node, locale);
    const messages = getNodeMessages(node);
    const hasErrors = messages.some((message) => message.type === "error");
    const isActionInput = inputType === "submit" || inputType === "button";
    const actionSubmitterKey = `${getString(attributes.name) ?? id}\u0000${
      getString(attributes.value) ?? ""
    }`;
    const disabled =
      attributes.disabled === true ||
      (formPending && isActionInput && formSubmitter !== actionSubmitterKey);
    const required = attributes.required === true;
    const maxLength = getNumber(attributes.maxlength);

    const description = getSafeText(getString(attributes.description));
    const errorId = `${id}-error`;
    const descriptionId = `${id}-description`;
    const describedBy = [description ? descriptionId : null, hasErrors ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

    if (inputType === "hidden") {
      return (
        <input
          id={id}
          key={id}
          name={name}
          type="hidden"
          value={stringValue ?? ""}
        />
      );
    }

    if (inputType === "submit" || inputType === "button") {
      const isProvider = isProviderNode(node);
      const lookupSecretAction = getLookupSecretAction(node);
      const providerName = isProvider ? getProviderName(node) : undefined;
      const providerActionKey =
        kind === "settings"
          ? name === "unlink"
            ? "ory.nodes.unlinkWith"
            : "ory.nodes.connectWith"
          : "ory.nodes.continueWith";
      const providerAction = providerName
        ? t(providerActionKey, { provider: providerName })
        : undefined;
      const isLoginAction = kind === "login" && name === "method";
      const isDestructiveLookupAction = lookupSecretAction === "lookup_secret_disable";
      const isDestructiveTotpAction = kind === "settings" && node.group === "totp" && name === "totp_unlink";
      const isDestructiveAction = isDestructiveLookupAction || isDestructiveTotpAction;
      const actionLabel = isLoginAction
        ? t("ory.nodes.login")
        : providerAction ?? label ?? stringValue ?? t("ory.nodes.continue");
      const actionClassName = cn(
        "min-h-11 w-full px-4",
        compactProvider
          ? "justify-center p-0"
          : isProvider
            ? "justify-start gap-3"
            : "justify-between",
        kind === "settings" && !compactProvider && "sm:w-auto",
      );
      const actionChildren = compactProvider ? (
        <span className="sr-only">{providerAction}</span>
      ) : (
        <span className={isProvider ? "flex-1 text-left" : undefined}>{actionLabel}</span>
      );
      const actionIcon = !isProvider ? <ArrowUpRight aria-hidden="true" data-icon="inline-end" /> : null;

      if (isDestructiveAction) {
        const confirmationKey = isDestructiveTotpAction
          ? "dashboard.settings.confirmations.disableTotp"
          : "dashboard.settings.confirmations.disableRecovery";

        return (
          <AlertDialog key={id}>
            <AlertDialogTrigger
              render={
                <Button
                  aria-label={compactProvider ? providerAction : undefined}
                  className={actionClassName}
                  data-ory-destructive-trigger={name}
                  disabled={disabled}
                  title={compactProvider ? providerAction : undefined}
                  type="button"
                  variant="destructive"
                />
              }
            >
              {isProvider ? <ProviderIcon node={node} /> : null}
              {actionChildren}
              {actionIcon}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t(`${confirmationKey}.title`)}</AlertDialogTitle>
                <AlertDialogDescription>{t(`${confirmationKey}.description`)}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("dashboard.settings.confirmations.cancel")}</AlertDialogCancel>
                <AlertDialogClose
                  render={
                    <OryTriggerButton
                      className="w-full sm:w-auto"
                      form={formId}
                      formNoValidate
                      name={name}
                      onClick={onActionStart}
                      onTriggerStart={() => onTriggerStart?.(actionSubmitterKey) ?? true}
                      trigger={getString(attributes.onclickTrigger)}
                      type="submit"
                      value={stringValue}
                      variant="destructive"
                    />
                  }
                >
                  {t(`${confirmationKey}.confirm`)}
                </AlertDialogClose>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      }

      return (
        <OryTriggerButton
          key={id}
          aria-label={compactProvider ? providerAction : undefined}
          className={actionClassName}
          disabled={disabled}
          formNoValidate={
            isProvider || (kind === "login" && name === "method") || undefined
          }
          name={name}
          onClick={onActionStart}
          onTriggerStart={() => onTriggerStart?.(actionSubmitterKey) ?? true}
          form={formId}
          title={compactProvider ? providerAction : undefined}
          trigger={getString(attributes.onclickTrigger)}
          type={inputType === "button" ? "button" : "submit"}
          value={stringValue}
          variant={isProvider ? "outline" : "default"}
        >
          {isProvider ? <ProviderIcon node={node} /> : null}
          {actionChildren}
          {actionIcon}
        </OryTriggerButton>
      );
    }

    if (inputType === "checkbox") {
      return (
        <Field
          key={id}
          data-invalid={hasErrors || undefined}
          orientation="horizontal"
        >
          <Checkbox
            aria-invalid={hasErrors || undefined}
            aria-describedby={describedBy}
            defaultChecked={isChecked(value)}
            disabled={disabled}
            id={id}
            name={name}
            required={required}
            value={stringValue ?? "true"}
          />
          <FieldContent>
            <FieldLabel htmlFor={id}>{label ?? t("ory.nodes.confirmChoice")}</FieldLabel>
            <FieldError
              id={errorId}
              errors={getErrorMessages(messages, locale).map((message) => ({
                message: message.text,
              }))}
            />
          </FieldContent>
        </Field>
      );
    }

    if (isCodeInput(node) || isTotpCodeInput(node)) {
      const length = Math.min(Math.max(maxLength ?? 6, 4), 8);

      return (
        <Field key={id} data-invalid={hasErrors || undefined}>
          <FieldLabel htmlFor={id}>
            {label ?? (isTotpCodeInput(node) ? t("ory.nodes.totpCode") : t("ory.nodes.verificationCode"))}
          </FieldLabel>
          <InputOTP
            autoComplete={getString(attributes.autocomplete) ?? "one-time-code"}
            aria-invalid={hasErrors || undefined}
            aria-describedby={describedBy}
            disabled={disabled}
            id={id}
            maxLength={length}
            name={name}
            onChange={setOtpValue}
            pattern={getString(attributes.pattern)}
            required={required}
            value={otpValue ?? stringValue ?? ""}
          >
            <InputOTPGroup>
              {Array.from({ length }, (_, index) => (
                <InputOTPSlot className="size-7 sm:size-8" key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <FieldError
            id={errorId}
            errors={getErrorMessages(messages, locale).map((message) => ({
              message: message.text,
            }))}
          />
        </Field>
      );
    }

    if (isLookupSecretInput(node)) {
      return (
        <Field key={id} data-invalid={hasErrors || undefined}>
          <FieldLabel htmlFor={id}>{label ?? t("ory.nodes.recoveryCode")}</FieldLabel>
          <Input
            aria-invalid={hasErrors || undefined}
            aria-describedby={describedBy}
            autoComplete={getString(attributes.autocomplete) ?? "one-time-code"}
            defaultValue={stringValue}
            disabled={disabled}
            id={id}
            maxLength={maxLength}
            name={name}
            pattern={getString(attributes.pattern)}
            required={required}
            spellCheck={false}
            type="text"
          />
          <FieldError
            id={errorId}
            errors={getErrorMessages(messages, locale).map((message) => ({
              message: message.text,
            }))}
          />
        </Field>
      );
    }

    return (
      <Field key={id} data-invalid={hasErrors || undefined}>
        <FieldLabel htmlFor={id}>{label ?? t("ory.nodes.value")}</FieldLabel>
        <Input
          aria-invalid={hasErrors || undefined}
          aria-describedby={describedBy}
          autoComplete={getString(attributes.autocomplete)}
          defaultValue={stringValue}
          disabled={disabled}
          id={id}
          maxLength={maxLength}
          name={name}
          pattern={getString(attributes.pattern)}
          placeholder={getString(attributes.placeholder)}
          required={required}
          type={inputType}
        />
        {description ? (
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
        ) : null}
        <FieldError
          id={errorId}
          errors={getErrorMessages(messages, locale).map((message) => ({
            message: message.text,
          }))}
        />
      </Field>
    );
  }

  if (node.type === "text") {
    const lookupSecretEntries = getLookupSecretEntries(node);

    if (isLookupSecretCodeNode(node) && lookupSecretEntries?.length) {
      return (
        <RecoveryCodes
          entries={lookupSecretEntries}
          fallbackText={getNodeText(node, locale)}
          id={id}
          label={getNodeLabel(node, locale)}
          pending={lookupSecretPending}
          confirmationAction={
            lookupSecretConfirmationNode ? (
              <OryNode
                formId={formId}
                formPending={formPending}
                formSubmitter={formSubmitter}
                kind={kind}
                node={lookupSecretConfirmationNode}
                onActionStart={onActionStart}
                onTriggerStart={onTriggerStart}
              />
            ) : undefined
          }
        />
      );
    }

    const text = getNodeText(node, locale);

    return text ? (
      <p
        key={id}
        className={
          node.messages.some((message) => message.type === "error")
            ? "text-sm text-destructive"
            : "text-sm leading-6 text-muted-foreground"
        }
      >
        {text}
      </p>
    ) : null;
  }

  if (node.type === "a") {
    const title = getSafeText(getString(getNodeAttributes(node).title));
    const titleRecord =
      typeof getNodeAttributes(node).title === "object"
        ? (getNodeAttributes(node).title as Record<string, unknown>)
        : {};
    const titleText = getSafeText(getString(titleRecord.text));

    const href = getString(attributes.href);

    if (!href || !isSafeProviderUrl(href, allowedOrigins)) {
      return null;
    }

    return (
      <ButtonLink
        key={id}
        className="w-fit px-0"
        size="sm"
        variant="link"
        href={href}
      >
        {title ?? titleText ?? t("ory.nodes.continue")}
      </ButtonLink>
    );
  }

  if (node.type === "img") {
    const src = getString(attributes.src);
    const isQrCode = node.group === "totp";

    const isSafeImage = isSafeProviderUrl(src, allowedOrigins) ||
      (isQrCode && typeof src === "string" && SAFE_QR_DATA_URL.test(src));

    if (!isSafeImage) {
      return null;
    }

    const image = (
      <img
        key={id}
        alt={isQrCode ? t("ory.nodes.qrCodeAlt") : getNodeLabel(node, locale) ?? t("ory.nodes.identityImageAlt")}
        className={isQrCode ? "size-full object-contain" : "max-h-48 max-w-full rounded-lg border border-border"}
        height={getNumber(attributes.height)}
        src={src}
        width={getNumber(attributes.width)}
      />
    );


    return isQrCode ? (
      <div className="aspect-square w-full max-w-48 overflow-hidden rounded-lg border border-border bg-white p-2" key={id}>
        {image}
      </div>
    ) : (
      image
    );
  }

  if (node.type === "div") {
    const data = attributes.data;
    const dataAttributes =
      typeof data === "object" && data !== null
        ? Object.fromEntries(
            Object.entries(data as Record<string, unknown>)
              .filter(([, value]) => typeof value === "string")
              .map(([key, value]) => [
                key.startsWith("data-") ? key : `data-${key}`,
                value,
              ]),
          )
        : {};

    return (
      <div
        key={id}
        className={getString(attributes._class)}
        data-ory-node={id}
        id={getString(attributes.id)}
        {...dataAttributes}
      />
    );
  }

  if (node.type === "script") {
    const src = getString(attributes.src);

    if (!isSafeProviderUrl(src, allowedOrigins)) {
      return null;
    }

    const crossOrigin = getString(attributes.crossorigin);
    const referrerPolicy = getString(attributes.referrerpolicy);
    const safeCrossOrigin =
      crossOrigin === "anonymous" || crossOrigin === "use-credentials"
        ? crossOrigin
        : undefined;
    const safeReferrerPolicy =
      referrerPolicy && VALID_REFERRER_POLICIES.has(referrerPolicy)
        ? referrerPolicy
        : undefined;

    return (
      <Script
        key={id}
        async={attributes.async === true}
        crossOrigin={safeCrossOrigin}
        id={id}
        integrity={getString(attributes.integrity) || undefined}
        nonce={getString(attributes.nonce) || undefined}
        referrerPolicy={safeReferrerPolicy as
          | "no-referrer"
          | "no-referrer-when-downgrade"
          | "origin"
          | "origin-when-cross-origin"
          | "same-origin"
          | "strict-origin"
          | "strict-origin-when-cross-origin"
          | "unsafe-url"
          | undefined}
        src={src}
        strategy="afterInteractive"
        type={getString(attributes.type) || undefined}
      />
    );
  }

  return null;
}
