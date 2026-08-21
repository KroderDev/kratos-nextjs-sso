"use client";

import { useEffect, useRef, type ComponentProps } from "react";

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

  useEffect(() => {
    if (!autoSubmit || submittedRef.current) {
      return;
    }

    submittedRef.current = true;
    formRef.current?.requestSubmit();
  }, [autoSubmit]);

  return <form ref={formRef} data-auto-submit={autoSubmit || undefined} {...props} />;
}
