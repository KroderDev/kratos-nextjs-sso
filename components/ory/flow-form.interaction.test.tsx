// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import type { UiNode } from "@ory/client-fetch";

import type { OryFlow } from "@/lib/ory/types";

import { FlowForm } from "./flow-form";

function actionNode(name: string, value: string): UiNode {
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
    },
  } as unknown as UiNode;
}

function buildFlow(): OryFlow {
  return {
    id: "flow-id",
    ui: {
      action: "/self-service/login?flow=flow-id",
      method: "POST",
      messages: [],
      nodes: [actionNode("method", "password"), actionNode("method", "passkey")],
    },
  } as unknown as OryFlow;
}

const mountedRoots: Array<{ container: HTMLDivElement; unmount: () => void }> = [];

afterEach(() => {
  for (const root of mountedRoots.splice(0)) {
    root.unmount();
    root.container.remove();
  }
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
});
