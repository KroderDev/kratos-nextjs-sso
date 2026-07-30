import Image from "next/image";
import Link from "next/link";

import {
  brandLogoDark,
  brandLogoLight,
  brandMark,
  brandName,
} from "@/lib/branding";
import { cn } from "@/lib/utils";

type BrandProps = {
  className?: string;
  inverted?: boolean;
};

export function Brand({ className, inverted = false }: BrandProps) {
  const hasLogo = Boolean(brandLogoLight);
  const logo = (
    <>
      <Image
        src={brandLogoLight}
        alt=""
        width={32}
        height={32}
        className={cn("size-8", inverted ? "hidden" : "dark:hidden")}
      />
      <Image
        src={brandLogoDark}
        alt=""
        width={32}
        height={32}
        className={cn("hidden size-8", inverted ? "block" : "dark:block")}
      />
    </>
  );

  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-3 text-sm font-semibold tracking-[0.16em]",
        inverted ? "text-secondary-foreground" : "text-foreground",
        className,
      )}
    >
      {hasLogo ? (
        logo
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "text-sm font-bold tracking-normal",
            !inverted &&
              "grid size-9 place-items-center rounded-xl border border-primary/20 bg-primary",
          )}
        >
          {brandMark}
        </span>
      )}
      <span>{brandName}</span>
    </Link>
  );
}
