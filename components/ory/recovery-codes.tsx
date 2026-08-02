"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Check, Copy, Download, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { LookupSecretEntry } from "@/lib/ory/flow";
import { useTranslation } from "@/lib/i18n/client";

type RecoveryCodesProps = {
  entries: LookupSecretEntry[];
  fallbackText?: string;
  id: string;
  label?: string;
  pending: boolean;
  confirmationAction?: ReactNode;
};

function formatUsedAt(entry: Extract<LookupSecretEntry, { kind: "used" }>, locale: string) {
  const timestamp =
    entry.usedAtUnix !== undefined ? entry.usedAtUnix * 1000 : Date.parse(entry.usedAt ?? "");

  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

export function RecoveryCodes({
  confirmationAction,
  entries,
  fallbackText,
  id,
  label,
  pending,
}: RecoveryCodesProps) {
  const { locale, t } = useTranslation();
  const [copied, setCopied] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const activeCodes = entries.filter(
    (entry): entry is Extract<LookupSecretEntry, { kind: "active" }> => entry.kind === "active",
  );
  const usedCodes = entries.filter(
    (entry): entry is Extract<LookupSecretEntry, { kind: "used" }> => entry.kind === "used",
  );
  const title = t("dashboard.settings.recoveryCodes.title");
  const availableLabelKey = activeCodes.length === 1
    ? "dashboard.settings.recoveryCodes.availableLabelOne"
    : "dashboard.settings.recoveryCodes.availableLabelOther";

  async function copyText(value: string, key: string) {
    setCopyFailed(false);

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(value);
      setCopied(key);
    } catch {
      setCopied(null);
      setCopyFailed(true);
    }
  }

  function downloadCodes() {
    try {
      const content = `${activeCodes.map((entry) => entry.code).join("\n")}\n`;
      const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
      const link = document.createElement("a");

      link.href = url;
      link.download = "backup-recovery-codes.txt";
      link.rel = "noopener";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setDownloaded(true);
    } catch {
      setDownloaded(false);
    }
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex min-w-0 flex-col gap-4"
      data-recovery-codes="true"
    >
      <h3 className="sr-only" id={`${id}-title`}>
        {title}
      </h3>

      {label ? <p className="text-sm leading-6 text-muted-foreground">{label}</p> : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {t(availableLabelKey, { count: activeCodes.length })}
        </span>
        {usedCodes.length > 0 ? (
          <span>
            {t("dashboard.settings.recoveryCodes.usedLabel")}: {usedCodes.length}
          </span>
        ) : null}
        {pending ? (
          <span className="text-primary">{t("dashboard.settings.recoveryCodes.pendingTitle")}</span>
        ) : null}
      </div>

      {pending ? (
        <Alert className="border-primary/25 bg-primary/5">
          <ShieldCheck aria-hidden="true" data-icon="inline-start" />
          <AlertTitle>{t("dashboard.settings.recoveryCodes.pendingTitle")}</AlertTitle>
          <AlertDescription>{t("dashboard.settings.recoveryCodes.pendingDescription")}</AlertDescription>
        </Alert>
      ) : null}

      {activeCodes.length > 0 ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              {title}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                aria-label={t("dashboard.settings.recoveryCodes.copyAll")}
                onClick={() => copyText(activeCodes.map((entry) => entry.code).join("\n"), "all")}
                size="sm"
                type="button"
                variant="outline"
              >
                {copied === "all" ? (
                  <Check aria-hidden="true" data-icon="inline-start" />
                ) : (
                  <Copy aria-hidden="true" data-icon="inline-start" />
                )}
                {copied === "all"
                  ? t("dashboard.settings.recoveryCodes.copied")
                  : t("dashboard.settings.recoveryCodes.copyAll")}
              </Button>
              <Button onClick={downloadCodes} size="sm" type="button" variant="ghost">
                <Download aria-hidden="true" data-icon="inline-start" />
                {downloaded
                  ? t("dashboard.settings.recoveryCodes.downloaded")
                  : t("dashboard.settings.recoveryCodes.download")}
              </Button>
            </div>
          </div>

          <div className="grid min-w-0 gap-2 sm:grid-cols-2" role="list">
            {activeCodes.map((entry, index) => {
              const key = `code-${index}`;

              return (
                <div
                  className="flex min-w-0 min-h-11 items-center justify-between gap-3 border border-border/70 bg-background px-3"
                  key={`${entry.code}-${index}`}
                  role="listitem"
                >
                  <code className="min-w-0 break-all font-mono text-sm tracking-[0.12em] text-foreground">
                    {entry.code}
                  </code>
                  <Button
                    aria-label={t("dashboard.settings.recoveryCodes.copyCode")}
                    onClick={() => copyText(entry.code, key)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    {copied === key ? (
                      <Check aria-hidden="true" data-icon="inline-start" />
                    ) : (
                      <Copy aria-hidden="true" data-icon="inline-start" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {copyFailed ? (
            <p className="text-sm text-destructive" role="alert">
              {t("dashboard.settings.recoveryCodes.copyFailed")}
            </p>
          ) : null}
          <p aria-live="polite" className="sr-only">
            {copied === "all"
              ? t("dashboard.settings.recoveryCodes.copied")
              : copied
                ? t("dashboard.settings.recoveryCodes.codeCopied")
                : downloaded
                  ? t("dashboard.settings.recoveryCodes.downloaded")
                  : ""}
          </p>
        </>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          {fallbackText ?? t("dashboard.settings.recoveryCodes.fallback")}
        </p>
      )}

      {usedCodes.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-border/70 pt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {t("dashboard.settings.recoveryCodes.usedLabel")}
          </p>
          <div className="grid min-w-0 gap-2 sm:grid-cols-2" role="list">
            {usedCodes.map((entry, index) => {
              const usedAt = formatUsedAt(entry, locale);

              return (
                <div
                  className="flex min-w-0 min-h-11 items-center justify-between gap-3 border border-border/50 bg-muted/30 px-3 text-sm text-muted-foreground"
                  key={`used-${index}`}
                  role="listitem"
                >
                  <code
                    aria-label={t("dashboard.settings.recoveryCodes.usedCode")}
                    className="font-mono tracking-[0.12em]"
                  >
                    ********
                  </code>
                  <span className="min-w-0 text-right">
                    {usedAt
                      ? t("dashboard.settings.recoveryCodes.usedOn", { date: usedAt })
                      : t("dashboard.settings.recoveryCodes.used")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {confirmationAction ? (
        <div className="flex flex-col items-stretch gap-3 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
          {confirmationAction}
        </div>
      ) : null}
    </section>
  );
}
