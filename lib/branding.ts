const DEFAULT_BRAND_NAME = "Your Platform";
const DEFAULT_BRAND_MARK = "Y";

function readBrandValue(value: string | undefined, fallback: string) {
  const normalizedValue = value?.trim();

  return normalizedValue || fallback;
}

export const brandName = readBrandValue(
  process.env.NEXT_PUBLIC_BRAND_NAME,
  DEFAULT_BRAND_NAME,
);

export const brandMark = readBrandValue(
  process.env.NEXT_PUBLIC_BRAND_MARK,
  brandName.slice(0, 1).toUpperCase() || DEFAULT_BRAND_MARK,
)
  .slice(0, 2)
  .toUpperCase();
