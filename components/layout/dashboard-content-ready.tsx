"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function DashboardContentReady() {
  const pathname = usePathname();

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("dashboard-content-ready", {
        detail: pathname,
      }),
    );
  }, [pathname]);

  return null;
}
