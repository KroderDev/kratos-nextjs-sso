"use client";

import { CircleAlert } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";
import { orySetupMessage } from "@/ory.config";
import { useTranslation } from "@/lib/i18n/client";

export function OrySetupState() {
  const { t } = useTranslation();

  return (
    <Alert className="border-primary/25 bg-primary/5">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>{t("ory.setup.title")}</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-4">
        <p>{orySetupMessage}</p>
        <ButtonLink
          className="w-fit"
          size="sm"
          variant="outline"
          href="/"
        >
          {t("ory.setup.returnHome")}
        </ButtonLink>
      </AlertDescription>
    </Alert>
  );
}

