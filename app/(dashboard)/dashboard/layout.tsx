import { getServerSession } from "@ory/nextjs/app";
import { redirect } from "next/navigation";

import { isOryConfigured } from "@/ory.config";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (isOryConfigured) {
    const session = await getServerSession();

    if (!session?.identity) {
      redirect("/auth/login?return_to=/dashboard");
    }
  }

  return children;
}
