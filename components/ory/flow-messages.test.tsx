import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UiText } from "@ory/client-fetch";

vi.mock("@/components/ui/toast", () => ({
  toast: {
    add: vi.fn(),
  },
}));

import { toast } from "@/components/ui/toast";

import { announceFlowMessages, FlowMessages } from "./flow-messages";

const message = (id: number, text: string, type: UiText["type"] = "info") =>
  ({ id, text, type } as UiText);

describe("FlowMessages", () => {
  it("renders translated titles for error, success, and informational messages", () => {
    const markup = renderToStaticMarkup(
      <FlowMessages
        messages={[
          message(1, "Invalid code", "error"),
          message(2, "Email updated", "success"),
          message(3, "Remember this device"),
        ]}
      />,
    );

    expect(markup).toContain("Action needed");
    expect(markup).toContain("Updated");
    expect(markup).toContain("Note");
    expect(markup).toContain("Invalid code");
    expect(markup).toContain("border-primary/25 bg-primary/5");
  });

  it("renders nothing for missing or empty messages", () => {
    expect(renderToStaticMarkup(<FlowMessages />)).toBe("");
    expect(renderToStaticMarkup(<FlowMessages messages={[message(1, "")]} />)).toBe("");
  });

  it("renders nothing when messages are delegated to toasts", () => {
    const markup = renderToStaticMarkup(
      <FlowMessages messages={[message(1, "Email updated", "success")]} mode="toast" />,
    );

    expect(markup).toBe("");
  });
});

describe("announceFlowMessages", () => {
  beforeEach(() => {
    vi.mocked(toast.add).mockClear();
  });

  it("maps Ory message types to dismissable toast payloads", () => {
    const announcedMessages = new Set<string>();
    const t = (key: string) => key;

    announceFlowMessages({
      announcedMessages,
      locale: "en",
      messages: [
        message(1, "Invalid code", "error"),
        message(2, "Email updated", "success"),
        message(3, "Remember this device"),
      ],
      t,
    });

    expect(toast.add).toHaveBeenCalledTimes(3);
    expect(toast.add).toHaveBeenNthCalledWith(1, {
      description: "Invalid code",
      title: "ory.messages.actionNeeded",
      type: "error",
    });
    expect(toast.add).toHaveBeenNthCalledWith(2, {
      description: "Email updated",
      title: "ory.messages.updated",
      type: "success",
    });
    expect(toast.add).toHaveBeenNthCalledWith(3, {
      description: "Remember this device",
      title: "ory.messages.note",
      type: "info",
    });
  });

  it("does not announce the same message more than once", () => {
    const announcedMessages = new Set<string>();
    const messages = [message(1, "Email updated", "success")];

    announceFlowMessages({ announcedMessages, locale: "en", messages, t: () => "Updated" });
    announceFlowMessages({ announcedMessages, locale: "en", messages, t: () => "Updated" });

    expect(toast.add).toHaveBeenCalledTimes(1);
  });

  it("does not replay persisted success messages after a reload", () => {
    const originalWindow = globalThis.window;
    const storedValues = new Map<string, string>();
    const storage = {
      getItem: (key: string) => storedValues.get(key) ?? null,
      removeItem: (key: string) => storedValues.delete(key),
      setItem: (key: string, value: string) => storedValues.set(key, value),
    } as unknown as Storage;
    const messages = [message(1, "Email updated", "success")];

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { sessionStorage: storage },
    });

    announceFlowMessages({ announcedMessages: new Set(), locale: "en", messages, t: () => "Updated" });
    announceFlowMessages({ announcedMessages: new Set(), locale: "en", messages, t: () => "Updated" });

    expect(toast.add).toHaveBeenCalledTimes(1);

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("persists an informational message when the settings flow succeeds", () => {
    const originalWindow = globalThis.window;
    const storedValues = new Map<string, string>();
    const storage = {
      getItem: (key: string) => storedValues.get(key) ?? null,
      removeItem: (key: string) => storedValues.delete(key),
      setItem: (key: string, value: string) => storedValues.set(key, value),
    } as unknown as Storage;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { sessionStorage: storage },
    });

    announceFlowMessages({
      announcedMessages: new Set(),
      flowState: "success",
      locale: "en",
      messages: [message(1, "Your changes have been saved!", "info")],
      t: () => "Updated",
    });

    expect(toast.add).toHaveBeenCalledWith({
      description: "Your changes have been saved!",
      title: "Updated",
      type: "success",
    });

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });
});
