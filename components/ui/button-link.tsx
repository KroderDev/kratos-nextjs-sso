import Link, { type LinkProps } from "next/link";
import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { buttonVariants } from "./button";

type ButtonLinkProps = LinkProps &
  Omit<ComponentProps<typeof Link>, keyof LinkProps> &
  VariantProps<typeof buttonVariants>;

export function ButtonLink({
  className,
  size = "default",
  variant = "default",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonVariants({ size, variant }), className)}
      {...props}
    />
  );
}
