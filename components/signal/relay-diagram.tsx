import { Fingerprint, Globe2, LockKeyhole } from "lucide-react";

import { cn } from "@/lib/utils";

const stages = [
  { detail: "Origin", icon: Globe2, label: "browser" },
  { detail: "Verified", icon: Fingerprint, label: "identity" },
  { detail: "Private", icon: LockKeyhole, label: "workspace" },
] as const;

type RelayDiagramProps = {
  className?: string;
};

export function RelayDiagram({ className }: RelayDiagramProps) {
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-foreground p-6 text-background shadow-2xl shadow-foreground/10 sm:p-8",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-signal">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-signal" />
          relay map
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-background/50">
          secure handoff
        </span>
      </div>

      <div className="relative mt-14">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 h-24 w-full -translate-y-1/2 overflow-visible text-signal"
          preserveAspectRatio="none"
          viewBox="0 0 640 120"
        >
          <path
            className="text-background/20"
            d="M16 60H182C203 60 212 31 234 31H406C428 31 437 89 458 89H624"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            className="relay-trace"
            d="M16 60H182C203 60 212 31 234 31H406C428 31 437 89 458 89H624"
            fill="none"
            stroke="currentColor"
            strokeDasharray="2 18"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
        </svg>

        <div className="relative grid gap-3 sm:grid-cols-3 sm:gap-4">
          {stages.map(({ detail, icon: Icon, label }) => (
            <div
              className="flex min-h-32 flex-col justify-between border border-background/20 bg-background/5 p-4 backdrop-blur-sm"
              key={label}
            >
              <Icon aria-hidden="true" className="size-5 text-signal" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/50">
                  {label}
                </p>
                <p className="mt-1 text-sm font-medium">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <figcaption className="mt-8 max-w-sm text-sm leading-6 text-background/60">
        A clear handoff from the browser session to the private work behind it.
      </figcaption>
    </figure>
  );
}
