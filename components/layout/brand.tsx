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
        inverted ? "text-background" : "text-foreground",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative grid size-9 place-items-center overflow-hidden rounded-xl border text-sm font-bold tracking-normal transition-transform group-hover:-rotate-6",
          inverted
            ? "border-background/30 bg-background/10"
            : "border-primary/20 bg-primary text-primary-foreground",
        )}
      >
        <span className="relative z-10">{brandMark}</span>
        <span className="absolute -right-2 -bottom-2 size-6 rounded-full bg-signal/70 blur-sm" />
      </span>
      <span>{brandName}</span>
    </Link>
  );
}
