"use client";

import type { ComponentProps, MouseEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  invokeOryTrigger,
  isAllowedOryTrigger,
} from "./ory-trigger-runtime";

/**
 * Sets a named form input's value, creating a hidden input when the field does not exist.
 *
 * @param form - The form containing the input
 * @param name - The input name
 * @param value - The value to assign
 */
function setFormValue(
  form: HTMLFormElement | null,
  name: string | undefined,
  value: string | undefined,
) {
  if (!form || !name) {
    return;
  }

  const existing = form.elements.namedItem(name);

  if (existing instanceof HTMLInputElement) {
    existing.value = value ?? "";
    return;
  }

  const hidden = document.createElement("input");
  hidden.type = "hidden";
  hidden.name = name;
  hidden.value = value ?? "";
  form.append(hidden);
}

type OryTriggerButtonProps = Omit<
  ComponentProps<typeof Button>,
  "children" | "onClick"
> & {
  children?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  trigger?: string;
};

/**
 * Renders a button that invokes an allowed Ory trigger or submits its associated form.
 *
 * @param name - The form field name used when preserving the trigger or button value
 * @param trigger - The Ory trigger to invoke when allowed
 * @param value - The value submitted with the form field
 * @returns A button configured with the supplied properties and trigger behavior
 */
export function OryTriggerButton({
  children,
  name,
  onClick,
  trigger,
  value,
  ...props
}: OryTriggerButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (isAllowedOryTrigger(trigger)) {
      event.preventDefault();
      setFormValue(event.currentTarget.form, name, value?.toString());
      invokeOryTrigger(trigger);
      return;
    }

    if (!trigger) {
      return;
    }

    // Unknown provider triggers must not execute arbitrary code. If Ory used
    // a button input for the trigger, preserve the action through a native
    // form submission instead of silently doing nothing.
    if (props.type === "button") {
      event.preventDefault();
      setFormValue(event.currentTarget.form, name, value?.toString());
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <Button name={name} onClick={handleClick} value={value} {...props}>
      {children}
    </Button>
  );
}
