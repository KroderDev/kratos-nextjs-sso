function readOptionalLegalUrl(value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized || /[\u0000-\u001f\u007f]/.test(normalized)) {
    return "";
  }

  if (
    normalized.startsWith("/") &&
    !normalized.startsWith("//") &&
    !normalized.includes("\\")
  ) {
    return normalized;
  }

  try {
    const url = new URL(normalized);
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname &&
      !url.username &&
      !url.password
    ) {
      return normalized;
    }
  } catch {
    // Invalid URL values are omitted from the UI.
  }

  return "";
}

export const termsOfServiceUrl = readOptionalLegalUrl(
  process.env.NEXT_PUBLIC_TERMS_URL,
);

export const privacyPolicyUrl = readOptionalLegalUrl(
  process.env.NEXT_PUBLIC_PRIVACY_URL,
);
