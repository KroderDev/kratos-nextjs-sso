"use client";

import { usePathname } from "next/navigation";

import { AuthFrame, AuthContentLoading } from "./auth-shell";
import { PageLoading } from "./page-loading";

export function RouteLoading() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth")) {
    return (
      <AuthFrame>
        <AuthContentLoading />
      </AuthFrame>
    );
  }

  return <PageLoading />;
}
