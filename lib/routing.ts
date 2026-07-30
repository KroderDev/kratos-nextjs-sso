export function isDashboardRoute(pathname: string) {
  return pathname === "/dashboard" || pathname === "/dashboard/settings";
}

export function isAuthLayoutRoute(pathname: string) {
  return pathname.startsWith("/auth/") && !isDashboardRoute(pathname);
}
