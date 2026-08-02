"use client";

import { useEffect, useRef } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { UiText } from "@ory/client-fetch";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import {
  getMessageText,
} from "@/lib/ory/flow";
import { FLOW_SUCCESS_TOASTS_STORAGE_KEY } from "@/lib/ory/settings-state";
import { useTranslation } from "@/lib/i18n/client";
import { toast } from "@/components/ui/toast";

type FlowMessagesProps = {
  flowState?: string | null;
  messages?: UiText[];
  mode?: "inline" | "toast";
};

type FlowMessageTranslator = (key: string) => string;

function getPersistedSuccessMessages() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const value = window.sessionStorage.getItem(FLOW_SUCCESS_TOASTS_STORAGE_KEY);
    const messages = value ? JSON.parse(value) : [];

    return Array.isArray(messages)
      ? new Set(messages.filter((message): message is string => typeof message === "string"))
      : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function persistSuccessMessages(messages: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      FLOW_SUCCESS_TOASTS_STORAGE_KEY,
      JSON.stringify([...messages]),
    );
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
}

export function announceFlowMessages({
  announcedMessages,
  flowState,
  locale,
  messages,
  t,
}: {
  announcedMessages: Set<string>;
  flowState?: string | null;
  locale: string;
  messages?: UiText[];
  t: FlowMessageTranslator;
}) {
  const persistedSuccessMessages = getPersistedSuccessMessages();
  let successMessagesChanged = false;

  (messages ?? []).forEach((message) => {
    const text = getMessageText(message, locale);
    const isSuccess = message.type === "success" || (flowState === "success" && message.type === "info");
    const messageKey = `${message.id}-${isSuccess ? "success" : message.type}`;

    if (
      !text ||
      announcedMessages.has(messageKey) ||
      (isSuccess && persistedSuccessMessages.has(messageKey))
    ) {
      return;
    }

    announcedMessages.add(messageKey);
    toast.add({
      description: text,
      title:
        message.type === "error"
          ? t("ory.messages.actionNeeded")
          : isSuccess
            ? t("ory.messages.updated")
            : t("ory.messages.note"),
      type: message.type === "error" ? "error" : isSuccess ? "success" : "info",
    });

    if (isSuccess) {
      persistedSuccessMessages.add(messageKey);
      successMessagesChanged = true;
    }
  });

  if (successMessagesChanged) {
    persistSuccessMessages(persistedSuccessMessages);
  }
}

export function FlowMessages({ flowState, messages, mode = "inline" }: FlowMessagesProps) {
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
      flowState,
      locale,
      messages: (messages ?? []).filter((message) => getMessageText(message, locale)),
      t,
    });
  }, [flowState, locale, mode, messages, t]);

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
