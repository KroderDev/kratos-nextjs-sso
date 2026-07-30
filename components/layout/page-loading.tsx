import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";

export function PageLoading() {
  return (
    <main className="min-h-screen bg-background px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-6">
          <Brand />
          <ThemeToggle />
        </div>
        <div className="mt-16 flex max-w-2xl flex-col gap-5">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-12 w-3/4 sm:h-14" />
          <Skeleton className="h-5 w-full max-w-lg" />
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    </main>
  );
}
