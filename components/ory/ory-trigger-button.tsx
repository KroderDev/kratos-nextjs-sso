"use client";

import type { ComponentProps, MouseEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { invokeOryTrigger } from "./ory-trigger-runtime";

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
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  trigger?: string;
};

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

    if (event.defaultPrevented || !trigger) {
      return;
    }

    event.preventDefault();
    setFormValue(event.currentTarget.form, name, value?.toString());
    invokeOryTrigger(trigger);
  }

  return (
    <Button name={name} onClick={handleClick} value={value} {...props}>
      {children}
    </Button>
  );
}
