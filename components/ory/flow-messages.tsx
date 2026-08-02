"use client";

import { useEffect, useRef } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { UiText } from "@ory/client-fetch";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { getMessageText } from "@/lib/ory/flow";
import { useTranslation } from "@/lib/i18n/client";
import { toast } from "@/components/ui/toast";

type FlowMessagesProps = {
  messages?: UiText[];
  mode?: "inline" | "toast";
};

type FlowMessageTranslator = (key: string) => string;

export function announceFlowMessages({
  announcedMessages,
  locale,
  messages,
  t,
}: {
  announcedMessages: Set<string>;
  locale: string;
  messages?: UiText[];
  t: FlowMessageTranslator;
}) {
  (messages ?? []).forEach((message) => {
    const text = getMessageText(message, locale);
    const messageKey = `${message.id}-${message.type}-${text}`;

    if (!text || announcedMessages.has(messageKey)) {
      return;
    }

    announcedMessages.add(messageKey);
    toast.add({
      description: text,
      title:
        message.type === "error"
          ? t("ory.messages.actionNeeded")
          : message.type === "success"
            ? t("ory.messages.updated")
            : t("ory.messages.note"),
      type: message.type === "error" ? "error" : message.type === "success" ? "success" : "info",
    });
  });
}

export function FlowMessages({ messages, mode = "inline" }: FlowMessagesProps) {
  const { t, locale } = useTranslation();
  const visibleMessages = (messages ?? []).filter((message) =>
    getMessageText(message, locale),
  );
  const announcedMessages = useRef(new Set<string>());

  useEffect(() => {
    if (mode !== "toast") {
      return;
    }

    announceFlowMessages({
      announcedMessages: announcedMessages.current,
      locale,
      messages: visibleMessages,
      t,
    });
  }, [locale, mode, t, visibleMessages]);

  if (visibleMessages.length === 0 || mode === "toast") {
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
