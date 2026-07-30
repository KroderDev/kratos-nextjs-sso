"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAVIGATION_TIMEOUT = 10_000;

function isNavigableLink(anchor: HTMLAnchorElement) {
  if (
    anchor.target === "_blank" ||
    anchor.hasAttribute("download") ||
    anchor.getAttribute("aria-disabled") === "true"
  ) {
    return false;
  }

  const url = new URL(anchor.href, window.location.href);

  return (
    url.origin === window.location.origin &&
    `${url.pathname}${url.search}` !==
      `${window.location.pathname}${window.location.search}`
  );
}

export function NavigationFeedback() {
  const pathname = usePathname();
  const [pendingPathname, setPendingPathname] = useState<string | null>(null);
  const pending = pendingPathname === pathname;

  useEffect(() => {
    let timeout: number | undefined;

    function start() {
      setPendingPathname(pathname);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setPendingPathname(null), NAVIGATION_TIMEOUT);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");

      if (anchor instanceof HTMLAnchorElement && isNavigableLink(anchor)) {
        start();
      }
    }

    function handleSubmit(event: SubmitEvent) {
      if (!event.defaultPrevented) {
        start();
      }
    }

    function handlePageShow() {
      setPendingPathname(null);
      window.clearTimeout(timeout);
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("pageshow", handlePageShow);
      window.clearTimeout(timeout);
    };
  }, [pathname]);

  return (
    <div
      aria-busy={pending}
      aria-label="Loading next page"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-primary/15"
      role="status"
    >
      <div
        className={
          pending
            ? "navigation-progress h-full w-full bg-primary"
            : "h-full w-0"
        }
      />
    </div>
  );
}
