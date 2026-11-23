import Image from "next/image";
import Link from "next/link";

import {
  brandLogoDark,
  brandLogoLight,
  brandName,
} from "@/lib/branding";
import { cn } from "@/lib/utils";

type BrandProps = {
  className?: string;
  inverted?: boolean;
};

export function Brand({ className, inverted = false }: BrandProps) {
  const logo = (
    <>
      {brandLogoLight ? (
        <Image
          src={brandLogoLight}
          alt=""
          width={32}
          height={32}
          className={cn("size-8", inverted ? "hidden" : "dark:hidden")}
        />
      ) : null}
      {brandLogoDark ? (
        <Image
          src={brandLogoDark}
          alt=""
          width={32}
          height={32}
          className={cn("hidden size-8", inverted ? "block" : "dark:block")}
        />
      ) : null}
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
      {logo}
      <span>{brandName}</span>
    </Link>
  );
}
