import { describe, expect, it } from "vitest";
import type { UiNode, UiText } from "@ory/client-fetch";

import {
  getErrorMessages,
  getMessageText,
  getNodeLabel,
  getNodeMessages,
  getNodeText,
  getNumber,
  getProviderName,
  getSafeText,
  isChecked,
  isCodeInput,
  isProviderNode,
  translateOryText,
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

  it("identifies provider submit nodes without treating regular submits as providers", () => {
    expect(
      isProviderNode(
        inputNode({
          group: "oidc",
          name: "provider",
          type: "submit",
          value: "google-provider",
        }),
      ),
    ).toBe(true);
    expect(
      isProviderNode(inputNode({ name: "method", type: "submit" })),
    ).toBe(false);
    expect(
      isProviderNode(inputNode({ name: "provider", type: "email" })),
    ).toBe(false);
  });

  it("normalizes provider names for accessible actions", () => {
    expect(
      getProviderName(
        inputNode({
          name: "provider",
          type: "submit",
          value: "google-provider",
          label: { id: 1, text: "Sign in with Google", type: "info" },
        }),
      ),
    ).toBe("Google");
    expect(
      getProviderName(inputNode({ name: "provider", value: "facebook" })),
    ).toBe("Meta");
    expect(
      getProviderName(
        inputNode({
          name: "provider",
          type: "submit",
          label: { id: 1, text: "Continue with Acme", type: "info" },
        }),
      ),
    ).toBe("Acme");

    const providers = [
      ["linkedin", "LinkedIn"],
      ["slack", "Slack"],
      ["spotify", "Spotify"],
      ["x", "X"],
      ["amazon", "Amazon"],
      ["netid", "NetID"],
      ["auth0", "Auth0"],
      ["gitlab", "GitLab"],
      ["salesforce", "Salesforce"],
      ["kick", "Kick"],
      ["tiktok", "TikTok"],
      ["paypal", "PayPal"],
      ["line", "LINE"],
      ["kakao", "Kakao"],
      ["wechat", "WeChat"],
      ["authentik", "Authentik"],
      ["keycloak", "Keycloak"],
      ["clerk", "Clerk"],
      ["ory-oauth2", "Ory OAuth2"],
      ["yahoo", "Yahoo!"],
    ] as const;

    for (const [value, expected] of providers) {
      expect(getProviderName(inputNode({ name: "provider", value }))).toBe(expected);
    }
  });

  it("uses the node meta label when the provider attribute has no label", () => {
    const node = inputNode({
      name: "provider",
      type: "submit",
      value: "custom-sso",
      label: undefined,
    });
    node.meta = {
      label: { id: 1, text: "Sign in with Acme SSO", type: "info" },
    };

    expect(getProviderName(node)).toBe("Acme SSO");
  });

  it("keeps node messages available for field-level errors", () => {
    const node = inputNode();
    node.messages = [
      { id: 4001, text: "Use a valid address.", type: "error" },
    ];

    expect(getNodeMessages(node)).toHaveLength(1);
    expect(getNodeMessages(node)[0]?.text).toBe("Use a valid address.");
    expect(getNodeMessages({ attributes: {} } as UiNode)).toEqual([]);
  });

  it("does not expose provider references in user-facing messages", () => {
    expect(
      getMessageText({
        id: 4002,
        text: "The Ory service could not complete this request.",
        type: "error",
      }),
    ).toBe("");
    expect(
      getMessageText({
        id: 4003,
        text: "Check the address and try again.",
        type: "error",
      }),
    ).toBe("Check the address and try again.");
  });

  it("recognizes browser checkbox values", () => {
    expect(isChecked(true)).toBe(true);
    expect(isChecked("on")).toBe(true);
    expect(isChecked("false")).toBe(false);
  });

  it("translates text to Spanish when es locale is passed", () => {
    expect(translateOryText("email", "es")).toBe("Correo electrónico");
    expect(translateOryText("sign in", "es")).toBe("Iniciar sesión");
    expect(translateOryText("Generate new backup recovery codes", "es")).toBe(
      "Generar nuevos códigos de recuperación de respaldo",
    );
    expect(translateOryText("Unknown text", "es")).toBe("Unknown text");
    expect(translateOryText("email", "en")).toBe("email");
    expect(translateOryText(undefined)).toBeUndefined();
  });

  it("extracts text attributes from nodes using getNodeText", () => {
    const node = inputNode({ text: { text: "Helpful hint text" } });
    expect(getNodeText(node)).toBe("Helpful hint text");
    expect(getNodeText(inputNode({ text: { text: "email" } }), "es")).toBe("Correo electrónico");
  });

  it("filters and formats error messages using getErrorMessages", () => {
    const messages: UiText[] = [
      { id: 1, type: "error", text: "use a valid address." },
      { id: 2, type: "info", text: "Please note this." },
      { id: 3, type: "error", text: "Ory internal error" }, // provider ref, filtered out
    ];

    const errorMsgs = getErrorMessages(messages, "es");
    expect(errorMsgs).toHaveLength(1);
    expect(errorMsgs[0]?.text).toBe("Usa una dirección válida.");
    expect(getErrorMessages(undefined)).toEqual([]);
  });

  it("parses numbers and handles edge cases using getNumber", () => {
    expect(getNumber(42)).toBe(42);
    expect(getNumber("100")).toBe(100);
    expect(getNumber("invalid")).toBeUndefined();
    expect(getNumber("")).toBeUndefined();
    expect(getNumber(null)).toBeUndefined();
    expect(getNumber(Infinity)).toBeUndefined();
  });

  it("filters safe text correctly using getSafeText", () => {
    expect(getSafeText("  valid input  ")).toBe("valid input");
    expect(getSafeText("kratos error")).toBeUndefined();
    expect(getSafeText("http://localhost/self-service/login")).toBeUndefined();
    expect(getSafeText("")).toBeUndefined();
    expect(getSafeText(undefined)).toBeUndefined();
  });

  it("translates 'e-mail' to 'Email' for the English locale only", () => {
    expect(translateOryText("e-mail", "en")).toBe("Email");
    expect(translateOryText("E-Mail", "en")).toBe("Email");
    expect(translateOryText("  e-mail  ", "en")).toBe("Email");
    expect(translateOryText("e-mail")).toBe("e-mail");
    expect(translateOryText("email", "en")).toBe("email");
  });

  it("treats a node as a provider when grouped as oidc even without name='provider'", () => {
    const groupedProvider = inputNode({
      name: "custom_provider",
      type: "button",
    });
    groupedProvider.group = "oidc";

    expect(
      isProviderNode(groupedProvider),
    ).toBe(true);
    expect(
      isProviderNode(
        inputNode({ group: "oidc", name: "provider", type: "text" }),
      ),
    ).toBe(false);
    expect(
      isProviderNode({
        type: "text",
        group: "oidc",
        attributes: { node_type: "text", name: "provider", type: "submit" },
      } as unknown as UiNode),
    ).toBe(false);
  });

  it("falls back to a cleaned label or 'Provider' when no known provider matches", () => {
    expect(
      getProviderName(
        inputNode({
          name: "provider",
          type: "submit",
          value: "unrecognized-sso",
          label: { id: 1, text: "Sign in with Custom SSO", type: "info" },
        }),
      ),
    ).toBe("Custom SSO");
    expect(
      getProviderName(inputNode({ name: "provider", value: "unrecognized-sso", label: undefined })),
    ).toBe("Provider");
  });
});
