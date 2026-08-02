// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UiText } from "@ory/client-fetch";

vi.mock("@/components/ui/toast", () => ({
  toast: {
    add: vi.fn(),
  },
}));

import { toast } from "@/components/ui/toast";
import { FLOW_SUCCESS_TOASTS_STORAGE_KEY } from "@/lib/ory/settings-state";

import { announceFlowMessages, FlowMessages } from "./flow-messages";

const message = (id: number, text: string, type: UiText["type"] = "info") =>
  ({ id, text, type } as UiText);

describe("FlowMessages browser behavior", () => {
  let mountedContainer: HTMLDivElement | undefined;
  let mountedRoot: Root | undefined;
  const originalSessionStorage = window.sessionStorage;

  beforeEach(() => {
    vi.mocked(toast.add).mockClear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    if (mountedRoot) {
      act(() => mountedRoot?.unmount());
    }
    mountedContainer?.remove();
    mountedRoot = undefined;
    mountedContainer = undefined;
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: originalSessionStorage,
    });
    window.sessionStorage.clear();
  });

  it("announces toast-mode messages from the client effect", async () => {
    mountedContainer = document.createElement("div");
    document.body.append(mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    await act(async () => {
      mountedRoot?.render(
        <FlowMessages
          messages={[message(1, "A note for the account")]}
          mode="toast"
        />,
      );
    });

    expect(toast.add).toHaveBeenCalledWith({
      description: "A note for the account",
      title: "Note",
      type: "info",
    });
    expect(mountedContainer.innerHTML).toBe("");
  });

  it("does not announce inline messages from the client effect", async () => {
    mountedContainer = document.createElement("div");
    document.body.append(mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    await act(async () => {
      mountedRoot?.render(
        <FlowMessages messages={[message(2, "An inline message")]} mode="inline" />,
      );
    });

    expect(toast.add).not.toHaveBeenCalled();
    expect(mountedContainer.textContent).toContain("An inline message");
  });

  it("ignores malformed persisted values and stores only the success identifier", () => {
    window.sessionStorage.setItem(FLOW_SUCCESS_TOASTS_STORAGE_KEY, "not-json");

    announceFlowMessages({
      announcedMessages: new Set(),
      flowState: "success",
      locale: "en",
      messages: [message(7, "Saved account email", "info")],
      t: (key) => (key === "ory.messages.updated" ? "Updated" : key),
    });

    expect(toast.add).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem(FLOW_SUCCESS_TOASTS_STORAGE_KEY)).toBe(
      '["7-success"]',
    );
    expect(window.sessionStorage.getItem(FLOW_SUCCESS_TOASTS_STORAGE_KEY)).not.toContain(
      "Saved account email",
    );
  });

  it("keeps announcing a success when session storage cannot be written", () => {
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error("storage denied");
        },
      },
    });

    announceFlowMessages({
      announcedMessages: new Set(),
      flowState: "success",
      locale: "en",
      messages: [message(8, "Saved securely", "info")],
      t: () => "Updated",
    });

    expect(toast.add).toHaveBeenCalledTimes(1);
  });
});
