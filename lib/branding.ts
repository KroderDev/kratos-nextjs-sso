const DEFAULT_BRAND_NAME = "Your Platform";
const DEFAULT_BRAND_LOGO_LIGHT = "/next.svg";
const DEFAULT_BRAND_LOGO_DARK = "/next-dark.svg";

function readBrandValue(value: string | undefined, fallback: string) {
  const normalizedValue = value?.trim();

  return normalizedValue || fallback;
}

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
  deriveBrandMark(brandName),
)
  .slice(0, 2)
  .toUpperCase();

export const brandLogoLight = readBrandValue(
  process.env.NEXT_PUBLIC_BRAND_LOGO_LIGHT,
  DEFAULT_BRAND_LOGO_LIGHT,
);

export const brandLogoDark = (() => {
  const raw = process.env.NEXT_PUBLIC_BRAND_LOGO_DARK?.trim();
  if (raw) return raw;
  if (raw === "") return brandLogoLight;
  return DEFAULT_BRAND_LOGO_DARK;
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

