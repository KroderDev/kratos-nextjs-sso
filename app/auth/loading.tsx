import { AuthShell } from "@/components/layout/auth-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <AuthShell
      description="Preparing a secure browser flow."
      eyebrow="Loading"
      title="Just a moment"
    >
      <Card className="rounded-3xl">
        <CardContent className="flex flex-col gap-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </AuthShell>
  );
}
