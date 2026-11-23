import type { LoginFlow, UiNode } from "@ory/client-fetch";
import { describe, expect, it } from "vitest";

import {
  getLoginLocaleOverride,
  parseLoginContextHints,
  prefillLoginIdentifier,
  stripLoginContextHints,
} from "./login-context";

function inputNode(name: string, value?: unknown): UiNode {
  return {
    type: "input",
    group: "default",
    attributes: { node_type: "input", name, type: "text", value },
    messages: [],
    meta: {},
  } as unknown as UiNode;
}

function loginFlow(nodes: UiNode[]): LoginFlow {
  return {
    id: "flow-id",
    type: "browser",
    issued_at: new Date(),
    expires_at: new Date(Date.now() + 60_000),
    request_url: "https://identity.example/self-service/login/browser",
    ui: {
      action: "https://identity.example/self-service/login",
      method: "POST",
      nodes,
      messages: [],
    },
    state: null,
    created_at: new Date(),
    updated_at: new Date(),
  } as unknown as LoginFlow;
}

describe("OIDC login context hints", () => {
  it("accepts a bounded login hint and maps the first supported locale preference", () => {
    expect(
      parseLoginContextHints({
        login_hint: "person@example.com",
        ui_locales: "fr-CA es-MX en-US",
        display: "popup",
      }),
    ).toEqual({
      display: "popup",
      loginHint: "person@example.com",
      uiLocale: "es",
    });
  });

  it("maps English and Spanish tags case-insensitively", () => {
    expect(parseLoginContextHints({ ui_locales: "ES-ar en-US" }).uiLocale).toBe("es");
    expect(parseLoginContextHints({ ui_locales: "fr-CA EN-gb" }).uiLocale).toBe("en");
  });

  it("ignores duplicate, empty, oversized, and controlled login hints", () => {
    for (const login_hint of [
      ["one@example.com", "two@example.com"],
      "  ",
      "a".repeat(257),
      "é".repeat(129),
      "😀".repeat(65),
      "person\u0000@example.com",
      "person\u0085@example.com",
      "person\u202e@example.com",
      "person\u2066@example.com",
    ]) {
      expect(parseLoginContextHints({ login_hint }).loginHint).toBeUndefined();
    }

    expect(parseLoginContextHints({ login_hint: "a".repeat(256) }).loginHint).toHaveLength(256);
    expect(parseLoginContextHints({ login_hint: "é".repeat(128) }).loginHint).toHaveLength(128);
    expect(parseLoginContextHints({ login_hint: "😀".repeat(64) }).loginHint).toHaveLength(128);
  });

  it("ignores ambiguous, malformed, unsupported, oversized, and controlled locale lists", () => {
    for (const ui_locales of [
      ["es", "en"],
      "fr-CA",
      "en  es",
      "en-ABCDEFGHI",
      "a".repeat(257),
      "en\u0009es",
      Array.from({ length: 17 }, () => "en").join(" "),
    ]) {
      expect(parseLoginContextHints({ ui_locales }).uiLocale).toBeUndefined();
    }
  });

  it("accepts only the standard display hints and ignores invalid or duplicate values", () => {
    for (const display of ["page", "popup", "touch", "wap"] as const) {
      expect(parseLoginContextHints({ display }).display).toBe(display);
    }

    for (const display of ["modal", "POPUP", "a".repeat(17), ["page", "popup"]]) {
      expect(parseLoginContextHints({ display }).display).toBeUndefined();
    }
  });

  it("lets a valid explicit lang win over ui_locales and otherwise returns the first supported hint", () => {
    expect(
      getLoginLocaleOverride({ lang: "en", ui_locales: "es-MX" }),
    ).toBeUndefined();
    expect(
      getLoginLocaleOverride({ lang: ["en", "es"], ui_locales: "fr-CA es-MX" }),
    ).toBe("es");
    expect(getLoginLocaleOverride({ ui_locales: "fr-CA" })).toBeUndefined();
  });

  it("strips login hints before flow URLs without mutating the input", () => {
    const params = {
      flow: "flow-id",
      login_hint: "person@example.com",
      ui_locales: "es",
      display: "touch",
      return_to: "/dashboard",
    };

    expect(stripLoginContextHints(params)).toEqual({
      flow: "flow-id",
      return_to: "/dashboard",
    });
    expect(params.login_hint).toBe("person@example.com");
  });

  it("prefills an empty identifier immutably without changing other fields", () => {
    const emptyIdentifier = inputNode("identifier", "");
    const otherInput = inputNode("username", "existing");
    const flow = loginFlow([emptyIdentifier, otherInput]);

    const result = prefillLoginIdentifier(flow, "hint@example.com");

    expect(result?.ui.nodes[0]?.attributes).toMatchObject({ value: "hint@example.com" });
    expect(result?.ui.nodes[1]).toBe(otherInput);
    expect(emptyIdentifier.attributes).not.toHaveProperty("value", "hint@example.com");
    expect(result).not.toBe(flow);
  });

  it("prefills a null-valued identifier input", () => {
    const nullIdentifier = inputNode("identifier", null);
    const flow = loginFlow([nullIdentifier]);

    const result = prefillLoginIdentifier(flow, "hint@example.com");

    expect(result?.ui.nodes[0]?.attributes).toMatchObject({ value: "hint@example.com" });
    expect(nullIdentifier.attributes).toMatchObject({ value: null });
  });

  it("preserves all Kratos identifiers when any identifier is already non-empty", () => {
    const emptyIdentifier = inputNode("identifier", "");
    const existingIdentifier = inputNode("identifier", "kratos@example.com");
    const flow = loginFlow([emptyIdentifier, existingIdentifier]);

    expect(prefillLoginIdentifier(flow, "hint@example.com")).toBe(flow);
    expect(emptyIdentifier.attributes).not.toHaveProperty("value", "hint@example.com");
  });

  it("leaves the flow unchanged when no identifier input exists", () => {
    const flow = loginFlow([inputNode("username", "existing")]);

    expect(prefillLoginIdentifier(flow, "hint@example.com")).toBe(flow);
  });

  it("does not alter a flow when it has no empty identifier or no hint", () => {
    const flow = loginFlow([inputNode("identifier", "existing")]);
    expect(prefillLoginIdentifier(flow, "hint@example.com")).toBe(flow);
    expect(prefillLoginIdentifier(flow, undefined)).toBe(flow);
  });
});
