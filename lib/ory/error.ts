import { Configuration, FrontendApi, type FlowError } from "@ory/client-fetch";

import { getSafeText } from "@/lib/ory/flow";
import { orySdkUrl } from "@/ory.config";

export function getKnownOryErrorMessage(
  reason: string | undefined,
  translate: (key: string) => string,
) {
  if (reason === "registration_disabled") {
    return translate("auth.error.registrationDisabled");
  }

  const reasonKeys: Record<string, string> = {
    recovery_disabled: "auth.error.recoveryDisabled",
    verification_disabled: "auth.error.verificationDisabled",
    invalid_request: "auth.error.invalidRequest",
    logout_unavailable: "auth.error.logoutUnavailable",
  };
  const key = reason ? reasonKeys[reason] : undefined;

  return key ? translate(key) : null;
}

export async function getOryFlowError(id: string): Promise<FlowError | null> {
  if (!orySdkUrl || !id) {
    return null;
  }

  try {
    const client = new FrontendApi(
      new Configuration({
        basePath: orySdkUrl,
        headers: { Accept: "application/json" },
      }),
    );

    return await client.getFlowError({ id });
  } catch {
    return null;
  }
}

export function getOryFlowErrorMessage(flowError: FlowError | null) {
  if (!flowError?.error || typeof flowError.error !== "object") {
    return null;
  }

  const payload = flowError.error as Record<string, unknown>;

  for (const key of ["message", "reason", "error_description", "description"]) {
    if (typeof payload[key] === "string" && payload[key].trim()) {
      const safeText = getSafeText(payload[key].trim());
      if (safeText) {
        return safeText;
      }
    }
  }

  return null;
}
