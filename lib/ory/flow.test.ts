import { describe, expect, it } from "vitest";
import type { UiNode } from "@ory/client-fetch";

import {
  getNodeLabel,
  getNodeMessages,
  isChecked,
  isCodeInput,
} from "./flow";

function inputNode(overrides: Record<string, unknown> = {}) {
  return {
    type: "input",
    group: "password",
    messages: [],
    meta: {},
    attributes: {
      node_type: "input",
      name: "identifier",
      type: "email",
      label: { id: 1, text: "Email address", type: "info" },
      ...overrides,
    },
  } as unknown as UiNode;
}

describe("Ory flow helpers", () => {
  it("prefers the node label and falls back to the input name", () => {
    expect(getNodeLabel(inputNode())).toBe("Email address");
    expect(
      getNodeLabel(
        inputNode({ label: undefined, name: "login_identifier" }),
      ),
    ).toBe("login_identifier");
  });

  it("identifies verification code inputs", () => {
    expect(
      isCodeInput(inputNode({ name: "code", type: "text", maxlength: 6 })),
    ).toBe(true);
    expect(isCodeInput(inputNode({ name: "code", type: "text" }))).toBe(false);
    expect(isCodeInput(inputNode({ name: "email", type: "email" }))).toBe(false);
  });

  it("keeps node messages available for field-level errors", () => {
    const node = inputNode();
    node.messages = [
      { id: 4001, text: "Use a valid address.", type: "error" },
    ];

    expect(getNodeMessages(node)).toHaveLength(1);
    expect(getNodeMessages(node)[0]?.text).toBe("Use a valid address.");
  });

  it("recognizes browser checkbox values", () => {
    expect(isChecked(true)).toBe(true);
    expect(isChecked("on")).toBe(true);
    expect(isChecked("false")).toBe(false);
  });
});
