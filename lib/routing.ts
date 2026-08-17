export function isDashboardRoute(pathname: string) {
  return pathname === "/dashboard" || pathname === "/dashboard/settings";
}

export function isAuthLayoutRoute(pathname: string) {
  const path = pathname.split("?", 1)[0];
  return (
    ["/login", "/registration", "/recovery", "/verification", "/consent", "/logout", "/error"].some(
      (route) => path === route || path.startsWith(`${route}/`),
    ) && !isDashboardRoute(pathname)
  );
}
