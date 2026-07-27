/* Ory may provide runtime-hosted images such as QR codes. */
/* eslint-disable @next/next/no-img-element */

import type { UiNode } from "@ory/client-fetch";
import Script from "next/script";
import { ArrowUpRight, ExternalLink } from "lucide-react";

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
  getString,
  isChecked,
  isCodeInput,
} from "@/lib/ory/flow";

import { OryTriggerButton } from "./ory-trigger-button";

type OryNodeProps = {
  node: UiNode;
};

function nodeId(node: UiNode) {
  const attributes = getNodeAttributes(node);
  return getString(attributes.id) ?? getString(attributes.name) ?? "ory-node";
}

export function OryNode({ node }: OryNodeProps) {
  const attributes = getNodeAttributes(node);
  const id = nodeId(node);

  if (node.type === "input") {
    const inputType = getString(attributes.type) ?? "text";
    const name = getString(attributes.name) ?? id;
    const value = attributes.value;
    const stringValue = getString(value);
    const label = getNodeLabel(node);
    const messages = getNodeMessages(node);
    const hasErrors = messages.some((message) => message.type === "error");
    const disabled = attributes.disabled === true;
    const required = attributes.required === true;
    const maxLength = getNumber(attributes.maxlength);
    const description = getString(attributes.description);
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
      return (
        <OryTriggerButton
          key={id}
          className="min-h-11 w-full justify-between px-4"
          disabled={disabled}
          name={name}
          trigger={getString(attributes.onclickTrigger)}
          type={inputType === "button" ? "button" : "submit"}
          value={stringValue}
          variant={node.group === "oidc" ? "outline" : "default"}
        >
          <span>{label ?? stringValue ?? "Continue"}</span>
          {node.group === "oidc" ? (
            <ExternalLink aria-hidden="true" data-icon="inline-end" />
          ) : (
            <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
          )}
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
            <FieldLabel htmlFor={id}>{label ?? "Confirm this choice"}</FieldLabel>
            <FieldError
              id={errorId}
              errors={getErrorMessages(messages).map((message) => ({
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
          <FieldLabel htmlFor={id}>{label ?? "Verification code"}</FieldLabel>
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
        <FieldLabel htmlFor={id}>{label ?? "Value"}</FieldLabel>
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
    const text = getNodeText(node);

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
    const title = getString(getNodeAttributes(node).title);
    const titleRecord =
      typeof getNodeAttributes(node).title === "object"
        ? (getNodeAttributes(node).title as Record<string, unknown>)
        : {};

    return (
      <ButtonLink
        key={id}
        className="w-fit px-0"
        size="sm"
        variant="link"
        href={getString(attributes.href) ?? "#"}
      >
        {title ?? getString(titleRecord.text) ?? "Continue"}
      </ButtonLink>
    );
  }

  if (node.type === "img") {
    const src = getString(attributes.src);

    if (!src) {
      return null;
    }

    return (
      <img
        key={id}
        alt={
          node.group === "totp"
            ? "Authenticator setup QR code"
            : getNodeLabel(node) ?? "Identity service image"
        }
        className="max-h-48 max-w-full rounded-lg border border-border"
        height={getNumber(attributes.height)}
        src={src}
        width={getNumber(attributes.width)}
      />
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

    if (!src) {
      return null;
    }

    const crossOrigin = getString(attributes.crossorigin);
    const referrerPolicy = getString(attributes.referrerpolicy);
    const safeCrossOrigin =
      crossOrigin === "anonymous" || crossOrigin === "use-credentials"
        ? crossOrigin
        : undefined;
    const safeReferrerPolicy = [
      "no-referrer",
      "no-referrer-when-downgrade",
      "origin",
      "origin-when-cross-origin",
      "same-origin",
      "strict-origin",
      "strict-origin-when-cross-origin",
      "unsafe-url",
    ].includes(referrerPolicy ?? "")
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
