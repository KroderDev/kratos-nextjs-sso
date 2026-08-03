"use client";

import { usePathname } from "next/navigation";

import { DashboardLoading } from "@/components/dashboard/dashboard-loading";
import { isAuthLayoutRoute, isDashboardRoute } from "@/lib/routing";

import { AuthFrame, AuthContentLoading } from "./auth-shell";
import { PageLoading } from "./page-loading";

export function RouteLoading() {
  const pathname = usePathname();

  if (isDashboardRoute(pathname)) {
    return (
      <DashboardLoading
        variant={pathname === "/dashboard/settings" ? "settings" : "overview"}
      />
    );
  }

  if (isAuthLayoutRoute(pathname)) {
    return (
      <AuthFrame>
        <AuthContentLoading />
      </AuthFrame>
    );
  }

  return <PageLoading />;
}
