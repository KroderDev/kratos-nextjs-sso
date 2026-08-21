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

/**
 * Determines whether a trigger name is supported by the Ory runtime.
 *
 * @param trigger - The trigger name to check
 * @returns `true` if the trigger is defined and supported, `false` otherwise
 */
export function isAllowedOryTrigger(trigger: string | undefined): trigger is string {
  return Boolean(trigger && allowedOryTriggers.has(trigger));
}

/**
 * Finds a callable trigger function registered on the global window object.
 *
 * @param trigger - The global property name to look up
 * @returns The trigger function if it is callable, `undefined` otherwise
 */
function triggerFunction(trigger: string) {
  const candidate = (window as unknown as Record<string, unknown>)[trigger];
  return typeof candidate === "function" ? (candidate as () => void) : undefined;
}

/**
 * Invokes an allowed Ory trigger when its function is available.
 *
 * @param trigger - The Ory trigger name to invoke.
 */
export function invokeOryTrigger(trigger: string | undefined) {
  if (!isAllowedOryTrigger(trigger)) {
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
