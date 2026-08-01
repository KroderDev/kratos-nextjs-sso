"use client";

import { useEffect } from "react";

export const allowedOryTriggers = new Set([
  "oryWebAuthnRegistration",
  "oryWebAuthnLogin",
  "oryPasskeyLogin",
  "oryPasskeyLoginAutocompleteInit",
  "oryPasskeyRegistration",
  "oryPasskeySettingsRegistration",
]);

function triggerFunction(trigger: string) {
  if (!allowedOryTriggers.has(trigger)) {
    return undefined;
  }

  const candidate = (window as unknown as Record<string, unknown>)[trigger];
  return typeof candidate === "function" ? (candidate as () => void) : undefined;
}

export function invokeOryTrigger(trigger: string | undefined) {
  if (!trigger) {
    return;
  }

  const ready = triggerFunction(trigger);

  if (ready) {
    ready();
    return;
  }

  let attempts = 0;
  const interval = window.setInterval(() => {
    attempts += 1;
    const loaded = triggerFunction(trigger);

    if (loaded) {
      window.clearInterval(interval);
      loaded();
    } else if (attempts >= 100) {
      window.clearInterval(interval);
    }
  }, 100);
}

export function getOryTriggerKey(triggers: string[]) {
  return triggers.join("|");
}

type OryTriggerRuntimeProps = {
  triggers: string[];
};

export function OryTriggerRuntime({ triggers }: OryTriggerRuntimeProps) {
  const triggerKey = getOryTriggerKey(triggers);

  useEffect(() => {
    for (const trigger of triggerKey.split("|").filter(Boolean)) {
      invokeOryTrigger(trigger);
    }
  }, [triggerKey]);

  return null;
}
