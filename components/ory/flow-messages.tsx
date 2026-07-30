"use client";

import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { UiText } from "@ory/client-fetch";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { getMessageText } from "@/lib/ory/flow";
import { useTranslation } from "@/lib/i18n/client";

type FlowMessagesProps = {
  messages?: UiText[];
};

export function FlowMessages({ messages }: FlowMessagesProps) {
  const { t, locale } = useTranslation();
  const visibleMessages = (messages ?? []).filter((message) =>
    getMessageText(message, locale),
  );

  if (visibleMessages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {visibleMessages.map((message, index) => {
        const isError = message.type === "error";
        const isSuccess = message.type === "success";
        const Icon = isError ? CircleAlert : isSuccess ? CircleCheck : Info;

        const titleText = isError
          ? t("ory.messages.actionNeeded")
          : isSuccess
            ? t("ory.messages.updated")
            : t("ory.messages.note");

        return (
          <Alert
            key={`${message.id}-${index}`}
            variant={isError ? "destructive" : "default"}
            className={isSuccess ? "border-primary/25 bg-primary/5" : undefined}
          >
            <Icon aria-hidden="true" />
            <AlertTitle>{titleText}</AlertTitle>
            <AlertDescription>{getMessageText(message, locale)}</AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}


