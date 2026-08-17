import type { ReactNode } from "react";

import { AuthFrame } from "@/components/layout/auth-shell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthFrame>{children}</AuthFrame>;
}
