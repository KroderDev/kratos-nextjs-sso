import { AuthShell } from "@/components/layout/auth-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <AuthShell
      description="Preparing a secure browser flow."
      eyebrow="Loading"
      title="Just a moment"
    >
      <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </AuthShell>
  );
}
