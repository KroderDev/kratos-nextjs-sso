"use client";

/* Ory may provide runtime-hosted images such as QR codes. */
/* eslint-disable @next/next/no-img-element */

import type { UiNode } from "@ory/client-fetch";
import Script from "next/script";
import { ArrowUpRight } from "lucide-react";

import type { OryFlowKind } from "@/lib/ory/types";

import { ButtonLink } from "@/components/ui/button-link";
import { Checkbox } from "@/components/ui/checkbox";
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
  getNodeLabel,
  getNodeMessages,
  getNodeText,
  getNumber,
  getProviderName,
  getString,
  getSafeText,
  isProviderNode,
  isChecked,
  isCodeInput,
} from "@/lib/ory/flow";

import { OryTriggerButton } from "./ory-trigger-button";
import { ProviderIcon as LibraryProviderIcon } from "./provider-icon";
import { allowedOryOrigins, isSafeProviderUrl } from "@/lib/ory/security";
import { appBaseUrl, oryCanonicalUrl, orySdkUrl } from "@/ory.config";
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

function ProviderIcon({ node }: { node: UiNode }) {
  return <LibraryProviderIcon node={node} />;

  const name = getProviderName(node).toLowerCase();

  if (name.includes("apple")) {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.09.35-1.1-.46-2.1-.48-3.27 0-1.46.62-2.23.44-3.09-.35C2.79 15.25 3.51 7.59 8.96 7.31c1.32.07 2.24.73 3.02.79 1.17-.24 2.29-.93 3.54-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.32 2.99-2.35 4.09ZM12.03 7.25C11.88 5.02 13.69 3.18 15.78 3c.29 2.58-2.34 4.5-3.75 4.25Z" />
      </svg>
    );
  }

  if (name.includes("google")) {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z" />
        <path fill="#34A853" d="M12 21.6c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.6Z" />
        <path fill="#FBBC05" d="M6.54 13.69a5.84 5.84 0 0 1 0-3.38V7.78H3.3a9.6 9.6 0 0 0 0 8.44l3.24-2.53Z" />
        <path fill="#EA4335" d="M12 6.28c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.39 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 8 9.46 6.28 12 6.28Z" />
      </svg>
    );
  }

  if (name.includes("github")) {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 2.25a9.75 9.75 0 0 0-3.08 19c.49.09.67-.21.67-.47v-1.67c-2.72.59-3.29-1.15-3.29-1.15-.44-1.13-1.08-1.43-1.08-1.43-.89-.61.07-.6.07-.6.98.07 1.5 1 1.5 1 .88 1.5 2.3 1.07 2.86.82.09-.64.34-1.07.62-1.32-2.17-.25-4.45-1.08-4.45-4.83 0-1.07.38-1.94 1-2.62-.1-.25-.43-1.24.1-2.58 0 0 .81-.26 2.67 1a9.27 9.27 0 0 1 4.86 0c1.86-1.26 2.67-1 2.67-1 .53 1.34.2 2.33.1 2.58.62.68 1 1.55 1 2.62 0 3.76-2.28 4.58-4.46 4.82.35.3.66.9.66 1.82v2.7c0 .26.18.56.68.46A9.75 9.75 0 0 0 12 2.25Z" />
      </svg>
    );
  }

  if (name.includes("facebook")) {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
        <path fill="#1877F2" d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.5-3.9 3.79-3.9 1.1 0 2.25.2 2.25.2v2.48h-1.27c-1.25 0-1.64.78-1.64 1.58V12h2.8l-.45 2.89h-2.35v6.99A10 10 0 0 0 22 12Z" />
      </svg>
    );
  }

  if (name.includes("discord")) {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
        <path fill="#5865F2" d="M19.54 5.14A16.2 16.2 0 0 0 15.6 4l-.48.98a14.8 14.8 0 0 0-6.24 0L8.4 4a16.2 16.2 0 0 0-3.94 1.14C1.96 8.7 1.27 12.17 1.62 15.59a16.4 16.4 0 0 0 4.83 2.44l1.17-1.59c-.64-.24-1.26-.54-1.84-.89l.45-.35c3.55 1.66 7.4 1.66 10.91 0l.45.35c-.58.35-1.2.65-1.84.89l1.17 1.59a16.4 16.4 0 0 0 4.83-2.44c.41-3.96-.7-7.4-2.21-10.45ZM8.6 14.1c-1.06 0-1.93-.97-1.93-2.16s.85-2.16 1.93-2.16 1.95.97 1.93 2.16c0 1.19-.85 2.16-1.93 2.16Zm6.8 0c-1.06 0-1.93-.97-1.93-2.16s.85-2.16 1.93-2.16 1.95.97 1.93 2.16c0 1.19-.85 2.16-1.93 2.16Z" />
      </svg>
    );
  }

  if (name.includes("meta")) {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M4.73 16.7c-1.76 0-2.98-1.24-2.98-3.55 0-3.17 2.04-6.27 4.82-6.27 1.45 0 2.58.87 3.43 2.14C10.87 7.75 12 6.88 13.45 6.88c2.78 0 4.82 3.1 4.82 6.27 0 2.31-1.22 3.55-2.98 3.55-1.43 0-2.45-1.03-3.26-2.56l-1.03-1.93-1.03 1.93c-.81 1.53-1.83 2.56-3.26 2.56-1.76 0-2.98-1.24-2.98-3.55 0-1.5.52-3.01 1.39-4.08-1.43.64-2.31 2.43-2.31 4.08 0 1.42.65 2.55 1.92 2.55Zm1.84-7.61c-1.08 0-2.82 1.61-2.82 4.06 0 1.06.37 1.55 1.08 1.55.69 0 1.31-.64 2.02-1.96l1.07-2.01C7.31 9.69 6.99 9.09 6.57 9.09Zm6.86 1.64 1.07 2.01c.71 1.32 1.33 1.96 2.02 1.96.71 0 1.08-.49 1.08-1.55 0-2.45-1.74-4.06-2.82-4.06-.42 0-.74.6-1.35 1.64Z" />
      </svg>
    );
  }

  if (name.includes("microsoft")) {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
        <path fill="#F35325" d="M2 2h9.5v9.5H2z" />
        <path fill="#81BC06" d="M12.5 2H22v9.5h-9.5z" />
        <path fill="#05A6F0" d="M2 12.5h9.5V22H2z" />
        <path fill="#FFBA08" d="M12.5 12.5H22V22h-9.5z" />
      </svg>
    );
  }

  if (name.includes("linkedin")) {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
        <path fill="#0A66C2" d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM2.75 10h4.46v11.25H2.75V10Zm7.25 0h4.28v1.54h.06c.6-1.14 2.05-2.34 4.22-2.34 4.51 0 5.34 2.97 5.34 6.83v5.22h-4.46v-4.63c0-1.1-.02-2.52-1.54-2.52-1.54 0-1.78 1.2-1.78 2.44v4.71H10V10Z" />
      </svg>
    );
  }

  if (name.includes("slack")) {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
        <path fill="#36C5F0" d="M6.2 14.1a2.1 2.1 0 1 1-2.1-2.1h2.1v2.1Zm1.05 0a2.1 2.1 0 1 1 4.2 0v5.25a2.1 2.1 0 1 1-4.2 0V14.1Z" />
        <path fill="#2EB67D" d="M9.35 6.2a2.1 2.1 0 1 1 2.1-2.1v2.1h-2.1Zm0 1.05a2.1 2.1 0 1 1 0 4.2H4.1a2.1 2.1 0 1 1 0-4.2h5.25Z" />
        <path fill="#ECB22E" d="M17.8 9.35a2.1 2.1 0 1 1 2.1 2.1h-2.1v-2.1Zm-1.05 0a2.1 2.1 0 1 1-4.2 0V4.1a2.1 2.1 0 1 1 4.2 0v5.25Z" />
        <path fill="#E01E5A" d="M14.65 17.8a2.1 2.1 0 1 1-2.1 2.1v-2.1h2.1Zm0-1.05a2.1 2.1 0 1 1 0-4.2h5.25a2.1 2.1 0 1 1 0 4.2h-5.25Z" />
      </svg>
    );
  }

  if (name.includes("spotify")) {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
        <path fill="#1DB954" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.59 14.43a.75.75 0 0 1-1.03.25c-2.83-1.73-6.4-2.12-10.6-1.16a.75.75 0 1 1-.34-1.46c4.6-1.05 8.54-.56 11.72 1.38.35.22.47.68.25 1.03Zm1.38-3.06a.94.94 0 0 1-1.29.31c-3.24-1.99-8.18-2.57-12-1.4a.94.94 0 1 1-.55-1.8c4.38-1.33 9.83-.68 13.53 1.59.44.27.58.85.31 1.3Zm.12-3.2C14.2 7.9 7.87 7.7 4.1 8.85a1.13 1.13 0 1 1-.66-2.16c4.33-1.31 11.53-1.05 15.9 1.55a1.13 1.13 0 0 1-1.25 1.93Z" />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.48 22H3.36l7.24-8.28L2.8 2h6.4l4.42 5.84L18.9 2Zm-1.1 17.73h1.73L8.26 4.13H6.4L17.8 19.73Z" />
      </svg>
    );
  }

  if (name.includes("amazon")) {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M6.55 8.2c0-1.78 1.06-2.76 3.1-2.76 1.1 0 1.9.24 2.5.72v-.5c0-1.04-.33-1.48-1.35-1.48-.83 0-1.62.2-2.44.62l-.47-1.54c1.05-.48 2.16-.72 3.33-.72 1.4 0 2.36.33 2.94 1.02.44.52.63 1.2.63 2.31v3.67c0 .76.12 1.08.56 1.5l-1.66 1.2c-.43-.38-.67-.68-.91-1.15-.82.85-1.66 1.2-2.75 1.2-2.16 0-3.48-1.1-3.48-3.02Zm5.6 1.09V7.94c-.51-.22-.92-.31-1.4-.31-.9 0-1.34.46-1.34 1.43 0 .87.34 1.3 1.05 1.3.63 0 1.2-.4 1.69-1.07Z" />
        <path fill="#FF9900" d="M4.3 15.6c4.37 2.7 9.81 2.88 14.35.54.37-.19.68.25.33.51-4.29 3.25-10.53 3.48-15.56.62-.42-.24-.08-.92.88-1.67Z" />
      </svg>
    );
  }

  if (name.includes("gitlab")) {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
        <path fill="#FC6D26" d="m12 20.5-3.1-9.54h6.2L12 20.5Zm0 0L3.77 11h4.96L12 20.5Zm0 0L20.23 11h-4.96L12 20.5Z" />
        <path fill="#E24329" d="m3.77 11 1.88-5.8a.57.57 0 0 1 1.08 0L8.73 11H3.77Zm16.46 0-1.88-5.8a.57.57 0 0 0-1.08 0L15.27 11h4.96Z" />
        <path fill="#FCA326" d="m3.77 11 8.23 9.5L3.77 11Zm16.46 0L12 20.5l8.23-9.5Z" />
      </svg>
    );
  }

  if (name.includes("auth0")) {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
        <path fill="#EB5424" d="M12 2.5 4.3 5.3l1.17 9.27L12 21.5l6.53-6.93L19.7 5.3 12 2.5Zm0 3.02 4.73 1.72-.72 5.7L12 17.8l-4.01-4.86-.72-5.7L12 5.52Z" />
      </svg>
    );
  }

  if (name.includes("netid")) {
    return (
      <span aria-hidden="true" className="flex size-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
        N
      </span>
    );
  }

  return (
    <span aria-hidden="true" className="flex size-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

type OryNodeProps = {
  compactProvider?: boolean;
  kind?: OryFlowKind;
  node: UiNode;
};

function nodeId(node: UiNode) {
  const attributes = getNodeAttributes(node);
  return getString(attributes.id) ?? getString(attributes.name) ?? "ory-node";
}

export function OryNode({ compactProvider = false, kind, node }: OryNodeProps) {
  const { t, locale } = useTranslation();
  const attributes = getNodeAttributes(node);
  const id = nodeId(node);

  if (node.type === "input") {
    const inputType = getString(attributes.type) ?? "text";
    const name = getString(attributes.name) ?? id;
    const value = attributes.value;
    const stringValue = getString(value);
    const label = getNodeLabel(node, locale);
    const messages = getNodeMessages(node);
    const hasErrors = messages.some((message) => message.type === "error");
    const disabled = attributes.disabled === true;
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
      const providerName = isProvider ? getProviderName(node) : undefined;
      const providerAction = providerName
        ? t("ory.nodes.continueWith", { provider: providerName })
        : undefined;
      const isLoginAction = kind === "login" && name === "method";

      return (
        <OryTriggerButton
          key={id}
          aria-label={compactProvider ? providerAction : undefined}
          className={`min-h-11 w-full px-4 ${
            compactProvider
              ? "justify-center p-0"
              : isProvider
                ? "justify-start gap-3"
                : "justify-between"
          }`}
          disabled={disabled}
          formNoValidate={isProvider || undefined}
          name={name}
          title={compactProvider ? providerAction : undefined}
          trigger={getString(attributes.onclickTrigger)}
          type={inputType === "button" ? "button" : "submit"}
          value={stringValue}
          variant={isProvider ? "outline" : "default"}
        >
          {isProvider ? <ProviderIcon node={node} /> : null}
          {compactProvider ? (
            <span className="sr-only">{providerAction}</span>
          ) : (
            <span className={isProvider ? "flex-1 text-left" : undefined}>
              {isLoginAction ? t("ory.nodes.login") : providerAction ?? label ?? stringValue ?? t("ory.nodes.continue")}
            </span>
          )}
          {!isProvider ? <ArrowUpRight aria-hidden="true" data-icon="inline-end" /> : null}
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

    if (isCodeInput(node)) {
      const length = Math.min(Math.max(maxLength ?? 6, 4), 8);

      return (
        <Field key={id} data-invalid={hasErrors || undefined}>
          <FieldLabel htmlFor={id}>{label ?? t("ory.nodes.verificationCode")}</FieldLabel>
          <InputOTP
            autoComplete={getString(attributes.autocomplete)}
            aria-invalid={hasErrors || undefined}
            aria-describedby={describedBy}
            defaultValue={stringValue ?? ""}
            disabled={disabled}
            id={id}
            maxLength={length}
            name={name}
            pattern={getString(attributes.pattern)}
            required={required}
          >
            <InputOTPGroup>
              {Array.from({ length }, (_, index) => (
                <InputOTPSlot className="size-7 sm:size-8" key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <FieldError
            id={errorId}
            errors={getErrorMessages(messages).map((message) => ({
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
          errors={getErrorMessages(messages).map((message) => ({
            message: message.text,
          }))}
        />
      </Field>
    );
  }

  if (node.type === "text") {
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

    if (!isSafeProviderUrl(src, allowedOrigins)) {
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
