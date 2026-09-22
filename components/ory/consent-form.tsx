"use client";

import { useEffect, useRef, type ComponentProps, type SubmitEvent } from "react";

type ConsentFormProps = ComponentProps<"form"> & {
  autoSubmit?: boolean;
};

/**
 * Automatically submits only forms rendered by this application. Provider
 * handoff data is used as form data, never as executable browser content.
 */
export function ConsentForm({ autoSubmit = false, ...props }: ConsentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  function handleSubmitCapture(event: SubmitEvent<HTMLFormElement>) {
    if (submittedRef.current) {
      event.preventDefault();
      return;
    }

    props.onSubmitCapture?.(event);
    if (event.defaultPrevented) {
      return;
    }

    submittedRef.current = true;
    event.currentTarget.setAttribute("aria-busy", "true");
    event.currentTarget
      .querySelectorAll<HTMLButtonElement | HTMLInputElement>(
        'button[type="submit"], input[type="submit"]',
      )
      .forEach((control) => {
        control.disabled = true;
      });
  }

  useEffect(() => {
    if (!autoSubmit || submittedRef.current) {
      return;
    }

    formRef.current?.requestSubmit();
  }, [autoSubmit]);

  return (
    <form
      {...props}
      ref={formRef}
      data-auto-submit={autoSubmit || undefined}
      onSubmitCapture={handleSubmitCapture}
    />
  );
}
