"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { brandFaviconDark, brandFaviconLight } from "@/lib/branding";

export function FaviconProvider() {
  const { resolvedTheme } = useTheme();
  const prevTheme = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!brandFaviconLight && !brandFaviconDark) return;
    if (resolvedTheme === prevTheme.current) return;
    prevTheme.current = resolvedTheme;

    const url =
      resolvedTheme === "dark" && brandFaviconDark
        ? brandFaviconDark
        : brandFaviconLight || brandFaviconDark;

    if (!url) return;

    document.querySelectorAll('link[rel="icon"]').forEach((el) => el.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    link.href = url;
    document.head.appendChild(link);
  }, [resolvedTheme]);

  return null;
}
