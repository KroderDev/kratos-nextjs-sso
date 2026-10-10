const DEFAULT_BRAND_NAME = "Kratos SSO";

function readBrandValue(value: string | undefined, fallback: string) {
  const normalizedValue = value?.trim();

  return normalizedValue || fallback;
}

export const brandName = readBrandValue(
  process.env.NEXT_PUBLIC_BRAND_NAME,
  DEFAULT_BRAND_NAME,
);

export const brandLogoLight = readOptionalBrandValue(
  process.env.NEXT_PUBLIC_BRAND_LOGO_LIGHT,
);

export const brandLogoDark = (() => {
  const raw = process.env.NEXT_PUBLIC_BRAND_LOGO_DARK?.trim();
  if (raw) return raw;
  // Empty string reuses the light logo in both themes; unset falls back to light too.
  return brandLogoLight;
})();

function readOptionalBrandValue(value: string | undefined): string {
  return value?.trim() || "";
}

export const brandFaviconLight = readOptionalBrandValue(
  process.env.NEXT_PUBLIC_BRAND_FAVICON_LIGHT,
);

export const brandFaviconDark = readOptionalBrandValue(
  process.env.NEXT_PUBLIC_BRAND_FAVICON_DARK,
);
