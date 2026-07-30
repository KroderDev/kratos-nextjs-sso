import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function PageLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading home page"
      className="min-h-screen bg-background text-foreground"
      role="status"
    >
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <Brand />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Skeleton className="hidden h-7 w-16 sm:block" />
          <Skeleton className="h-9 w-28" />
        </div>
      </header>

      <div className="mx-auto max-w-7xl">
        <section className="grid items-end gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.6fr)] lg:gap-20 lg:px-10 lg:pt-24">
          <div>
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="mt-7 h-28 w-full max-w-3xl sm:h-40" />
            <div className="mt-8 flex max-w-xl flex-col gap-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-11 w-full sm:w-52" />
              <Skeleton className="h-11 w-full sm:w-44" />
            </div>
          </div>

          <Card className="h-full bg-secondary/45 p-0">
            <CardHeader className="gap-0 p-6 sm:p-8">
              <div className="flex items-center justify-between border-b pb-5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="size-2 rounded-full" />
              </div>
              <Skeleton className="mt-10 h-16 w-full max-w-xs" />
              <div className="mt-4 flex max-w-xs flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="mt-10 flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            </CardHeader>
          </Card>
        </section>

        <div className="px-5 sm:px-8 lg:px-10">
          <Separator />
        </div>

        <section className="grid gap-5 px-5 py-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 lg:px-10 lg:py-20">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card className={index === 2 ? "sm:col-span-2 lg:col-span-1" : undefined} key={index}>
              <CardHeader>
                <Skeleton className="size-5" />
                <Skeleton className="mt-5 h-6 w-40" />
                <div className="mt-1 flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </section>

        <div className="px-5 sm:px-8 lg:px-10">
          <Separator />
        </div>

        <section className="mx-5 flex flex-col gap-6 pt-8 sm:mx-8 sm:flex-row sm:items-center sm:justify-between lg:mx-10">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-28" />
        </section>
      </div>
    </main>
  );
}
