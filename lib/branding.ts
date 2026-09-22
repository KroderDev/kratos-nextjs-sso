const DEFAULT_BRAND_NAME = "Kratos SSO";
const DEFAULT_BRAND_MARK = "KS";

function readBrandValue(value: string | undefined, fallback: string) {
  const normalizedValue = value?.trim();

  return normalizedValue || fallback;
}

/**
 * Derives a two-letter uppercase brand mark from a name.
 *
 * @param name - The brand name used to generate the mark
 * @returns The uppercase initials of the first two words, or the first two characters when the name contains one word
 */
function deriveBrandMark(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const brandName = readBrandValue(
  process.env.NEXT_PUBLIC_BRAND_NAME,
  DEFAULT_BRAND_NAME,
);

export const brandMark = readBrandValue(
  process.env.NEXT_PUBLIC_BRAND_MARK,
  process.env.NEXT_PUBLIC_BRAND_NAME?.trim()
    ? deriveBrandMark(brandName)
    : DEFAULT_BRAND_MARK,
)
  .slice(0, 2)
  .toUpperCase();

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
