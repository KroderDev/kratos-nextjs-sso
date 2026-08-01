export type OryFlowType =
  | "login"
  | "registration"
  | "recovery"
  | "verification"
  | "settings";

function getRedirectUrl(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return "";
  }

  const digest = String(error.digest);
  return digest.startsWith("NEXT_REDIRECT;") ? digest.split(";")[2] ?? "" : "";
}

export function isOryFlowRestartRedirect(error: unknown, flowType: OryFlowType) {
  return getRedirectUrl(error).includes(`/self-service/${flowType}/browser`);
}
