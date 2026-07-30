"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { isAuthLayoutRoute, isDashboardRoute } from "@/lib/routing";

import { DashboardLoading } from "@/components/dashboard/dashboard-loading";

import { AuthContentLoading, AuthFrame } from "./auth-shell";

const NAVIGATION_TIMEOUT = 10_000;

type PendingNavigation =
  | { kind: "route"; targetPathname: string }
  | { kind: "document" };

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
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null);
  const pending = pendingNavigation !== null;
  const authPending =
    pending &&
    pendingNavigation?.kind === "route" &&
    isAuthLayoutRoute(pendingNavigation.targetPathname);
  const dashboardPending =
    pending &&
    pendingNavigation?.kind === "route" &&
    isDashboardRoute(pendingNavigation.targetPathname);

  useEffect(() => {
    if (
      pendingNavigation?.kind !== "route" ||
      pendingNavigation.targetPathname !== pathname ||
      isAuthLayoutRoute(pendingNavigation.targetPathname) ||
      isDashboardRoute(pendingNavigation.targetPathname)
    ) {
      return;
    }

    const cleanup = window.setTimeout(() => setPendingNavigation(null), 0);

    return () => window.clearTimeout(cleanup);
  }, [pathname, pendingNavigation]);

  useEffect(() => {
    let timeout: number | undefined;

    function start(navigation: PendingNavigation) {
      setPendingNavigation(navigation);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setPendingNavigation(null), NAVIGATION_TIMEOUT);
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
        const url = new URL(anchor.href, window.location.href);
        start({ kind: "route", targetPathname: url.pathname });
      }
    }

    function handleSubmit(event: SubmitEvent) {
      if (!event.defaultPrevented) {
        start({ kind: "document" });
      }
    }

    function clear() {
      setPendingNavigation(null);
      window.clearTimeout(timeout);
    }

    function handleAuthReady(event: Event) {
      const path = (event as CustomEvent<string>).detail;

      setPendingNavigation((navigation) => {
        if (
          navigation?.kind === "route" &&
          navigation.targetPathname === path
        ) {
          window.clearTimeout(timeout);
          return null;
        }

        return navigation;
      });
    }

    function handleDashboardReady(event: Event) {
      const path = (event as CustomEvent<string>).detail;

      setPendingNavigation((navigation) => {
        if (
          navigation?.kind === "route" &&
          navigation.targetPathname === path &&
          isDashboardRoute(path)
        ) {
          window.clearTimeout(timeout);
          return null;
        }

        return navigation;
      });
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    window.addEventListener("pageshow", clear);
    window.addEventListener("popstate", clear);
    window.addEventListener("auth-content-ready", handleAuthReady);
    window.addEventListener("dashboard-content-ready", handleDashboardReady);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("pageshow", clear);
      window.removeEventListener("popstate", clear);
      window.removeEventListener("auth-content-ready", handleAuthReady);
      window.removeEventListener("dashboard-content-ready", handleDashboardReady);
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      {authPending ? (
        <div className="fixed inset-0 z-40 overflow-auto bg-background">
          <AuthFrame>
            <AuthContentLoading />
          </AuthFrame>
        </div>
      ) : null}
      {dashboardPending ? (
        <div className="fixed inset-0 z-40 overflow-auto bg-background">
          <DashboardLoading />
        </div>
      ) : null}
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
    </>
  );
}
