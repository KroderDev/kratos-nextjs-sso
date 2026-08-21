// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UiNode } from "@ory/client-fetch";

import type { OryFlow } from "@/lib/ory/types";

vi.mock("./ory-trigger-runtime", () => ({
  invokeOryTrigger: vi.fn(),
  isAllowedOryTrigger: (trigger: string | undefined) => trigger === "oryPasskeyLogin",
  OryTriggerRuntime: () => null,
}));

import { FlowForm } from "./flow-form";
import { invokeOryTrigger } from "./ory-trigger-runtime";

function actionNode(
  name: string,
  value: string,
  extraAttributes: Record<string, unknown> = {},
): UiNode {
  return {
    type: "input",
    group: "password",
    messages: [],
    meta: {},
    attributes: {
      node_type: "input",
      label: { id: 1, text: value, type: "info" },
      name,
      type: "submit",
      value,
      ...extraAttributes,
    },
  } as unknown as UiNode;
}

function buildFlow(passkeyTrigger?: string): OryFlow {
  return {
    id: "flow-id",
    ui: {
      action: "/self-service/login?flow=flow-id",
      method: "POST",
      messages: [],
      nodes: [
        actionNode("method", "password"),
        actionNode("method", "passkey", passkeyTrigger ? { onclickTrigger: passkeyTrigger } : {}),
      ],
    },
  } as unknown as OryFlow;
}

const mountedRoots: Array<{ container: HTMLDivElement; unmount: () => void }> = [];

afterEach(() => {
  for (const root of mountedRoots.splice(0)) {
    root.unmount();
    root.container.remove();
  }
  vi.mocked(invokeOryTrigger).mockClear();
});

describe("FlowForm submission state", () => {
  it("keeps the clicked submitter enabled while disabling other actions", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    mountedRoots.push({ container, unmount: () => root.unmount() });

    await act(async () => {
      root.render(<FlowForm flow={buildFlow()} kind="login" />);
    });

    const form = container.querySelector("form");
    const buttons = [...container.querySelectorAll("button")];
    expect(form).not.toBeNull();
    expect(buttons).toHaveLength(2);

    await act(async () => {
      form!.dispatchEvent(
        new SubmitEvent("submit", {
          bubbles: true,
          cancelable: true,
          submitter: buttons[0],
        }),
      );
    });

    expect(form?.getAttribute("aria-busy")).toBe("true");
    expect(buttons[0]?.hasAttribute("disabled")).toBe(false);
    expect(buttons[1]?.hasAttribute("disabled")).toBe(true);
  });

  it("starts an allowlisted trigger once and permits one completion submit", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    mountedRoots.push({ container, unmount: () => root.unmount() });

    await act(async () => {
      root.render(<FlowForm flow={buildFlow("oryPasskeyLogin")} kind="login" />);
    });

    const form = container.querySelector("form");
    const buttons = [...container.querySelectorAll("button")];
    expect(form).not.toBeNull();
    expect(buttons).toHaveLength(2);

    await act(async () => {
      buttons[1]?.click();
    });
    await act(async () => {
      buttons[1]?.click();
    });

    expect(vi.mocked(invokeOryTrigger)).toHaveBeenCalledTimes(1);
    expect(buttons[0]?.hasAttribute("disabled")).toBe(true);
    expect(buttons[1]?.hasAttribute("disabled")).toBe(false);

    const completion = new SubmitEvent("submit", {
      bubbles: true,
      cancelable: true,
      submitter: buttons[1],
    });
    await act(async () => {
      form?.dispatchEvent(completion);
    });

    expect(completion.defaultPrevented).toBe(false);

    const duplicate = new SubmitEvent("submit", {
      bubbles: true,
      cancelable: true,
      submitter: buttons[1],
    });
    await act(async () => {
      form?.dispatchEvent(duplicate);
    });

    expect(duplicate.defaultPrevented).toBe(true);
  });
});
