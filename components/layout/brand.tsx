import Image from "next/image";
import Link from "next/link";

import { brandMark, brandName } from "@/lib/branding";
import { cn } from "@/lib/utils";

type BrandProps = {
  className?: string;
  inverted?: boolean;
};

export function Brand({ className, inverted = false }: BrandProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-3 text-sm font-semibold tracking-[0.16em]",
        inverted ? "text-secondary-foreground" : "text-foreground",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-9 place-items-center rounded-xl border text-sm font-bold tracking-normal",
          inverted
            ? "border-secondary-foreground/30 bg-secondary-foreground/10"
            : "border-primary/20 bg-primary text-primary-foreground",
        )}
      >
        {brandMark === "Y" ? (
          <Image
            src="/next.svg"
            alt=""
            width={24}
            height={24}
            className={cn("size-6", inverted && "invert")}
          />
        ) : (
          <span>{brandMark}</span>
        )}
      </span>
      <span>{brandName}</span>
    </Link>
  );
}
