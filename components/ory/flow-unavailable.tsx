"use client";

import { CircleAlert } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useTranslation } from "@/lib/i18n/client";

export function FlowUnavailable() {
  const { t } = useTranslation();

  return (
    <Alert className="border-destructive/25 bg-destructive/5" variant="destructive">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>{t("ory.unavailable.title")}</AlertTitle>
      <AlertDescription className="mt-1">
        {t("ory.unavailable.description")}
      </AlertDescription>
    </Alert>
  );
}

